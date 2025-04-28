import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getKeywordDetails, updateKeywordStatus } from '@/lib/googleAds';
import { updateKeywordStatus as updateKeywordStatusApi } from '@/lib/api';

interface KeywordInfo {
  id: string;
  keyword: string;
  adGroupId: string;
  adGroupName: string;
  campaignId: string;
  campaignName: string;
}

interface ChatResponse {
  response: string;
  actions?: {
    type: string;
    status?: string;
    bidAmount?: number;
    matchType?: string;
    success?: boolean;
    message?: string;
  }[];
}

export async function POST(request: NextRequest) {
  console.log('========== 챗봇 API 요청 시작 ==========');
  
  try {
    const { message, keywordInfo }: { message: string; keywordInfo: KeywordInfo } = await request.json();
    
    console.log('사용자 메시지:', message);
    console.log('키워드 정보:', keywordInfo);
    
    if (!message) {
      console.log('오류: 메시지가 없습니다');
      return NextResponse.json({ error: '메시지를 제공해야 합니다' }, { status: 400 });
    }
    
    // OpenAI API 키 확인
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('경고: OpenAI API 키가 설정되지 않았습니다. 목(mock) 응답을 생성합니다.');
      // 목(mock) 응답
      const mockResponse = generateMockResponse(message, keywordInfo);
      console.log('목(mock) 응답:', mockResponse);
      return NextResponse.json(mockResponse);
    }
    
    // 키워드 ID가 있는 경우 실제 키워드 상세 정보 가져오기
    let keywordDetails = null;
    let keywordDetailsRaw = null;
    if (keywordInfo && keywordInfo.id) {
      try {
        console.log(`키워드 상세 정보 요청: ${keywordInfo.id}`);
        keywordDetails = await getKeywordDetails(keywordInfo.id, keywordInfo.adGroupId);
        keywordDetailsRaw = JSON.stringify(keywordDetails, null, 2);
        console.log('키워드 상세 정보 조회 결과:', keywordDetailsRaw);
      } catch (error) {
        console.error('키워드 상세 정보 조회 실패:', error);
      }
    }
    
    // OpenAI 클라이언트 초기화
    const openai = new OpenAI({ apiKey });
    
    // 시스템 프롬프트 생성
    const systemPrompt = generateSystemPrompt(keywordInfo, keywordDetails, keywordDetailsRaw);
    console.log('시스템 프롬프트:', systemPrompt);
    
    // OpenAI API 요청
    console.log('OpenAI API 요청 시작...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    console.log('OpenAI API 응답 받음:', {
      assistantMessage: response.choices[0].message.content,
      usage: response.usage,
    });
    
    const assistantResponseRaw = response.choices[0].message.content || '{"response": "응답을 생성할 수 없습니다"}';
    
    try {
      // JSON 파싱
      const parsedResponse = JSON.parse(assistantResponseRaw) as ChatResponse;
      
      // 작업 실행
      if (parsedResponse.actions && parsedResponse.actions.length > 0) {
        for (const action of parsedResponse.actions) {
          await executeAction(action, keywordInfo);
        }
      }
      
      console.log('========== 챗봇 API 요청 완료 ==========');
      return NextResponse.json(parsedResponse);
    } catch (parseError) {
      console.error('응답 파싱 오류:', parseError);
      return NextResponse.json({ 
        response: '응답 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        error: 'JSON 파싱 오류'
      });
    }
    
  } catch (error) {
    console.error('챗봇 API 요청 처리 중 오류 발생:', error);
    return NextResponse.json({ 
      response: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      error: '서버 오류'
    }, { status: 500 });
  }
}

// 작업 실행 함수
async function executeAction(action: any, keywordInfo: KeywordInfo) {
  if (!keywordInfo || !keywordInfo.id || !keywordInfo.adGroupId) {
    console.log('작업 실행을 위한 키워드 정보가 불충분함');
    return;
  }
  
  console.log(`작업 실행: ${action.type}`, action);
  
  try {
    switch (action.type) {
      case 'updateStatus':
        if (action.status) {
          // Google Ads API로 상태 업데이트
          const result = await updateKeywordStatus(keywordInfo.id, keywordInfo.adGroupId, action.status);
          console.log('상태 업데이트 결과:', result);
          
          // 백엔드 API로도 상태 업데이트 (중복 호출이지만 안전을 위해)
          const apiResult = await updateKeywordStatusApi(keywordInfo.id, keywordInfo.adGroupId, action.status);
          console.log('API 상태 업데이트 결과:', apiResult);
          
          action.success = result.success;
          action.message = result.message;
        }
        break;
        
      // 나중에 추가될 수 있는 다른 작업 유형들
      // case 'updateBid':
      //   // 입찰가 업데이트 로직 구현
      //   break;
        
      // case 'updateMatchType':
      //   // 매칭 타입 업데이트 로직 구현
      //   break;
        
      default:
        console.log(`지원되지 않는 작업 유형: ${action.type}`);
    }
  } catch (error) {
    console.error(`작업 실행 중 오류 (${action.type}):`, error);
    action.success = false;
    action.message = '작업 실행 중 오류가 발생했습니다';
  }
}

// 시스템 프롬프트 생성 함수
function generateSystemPrompt(keywordInfo: KeywordInfo | undefined, keywordDetails: any = null, keywordDetailsRaw: string | null = null): string {
  if (!keywordInfo) {
    return `당신은 광고 키워드 설정을 관리하는 실행형 챗봇입니다. 사용자의 요청에 따라 키워드 설정을 변경하고 결과를 알려주세요.
응답은 반드시 유효한 JSON 형식으로 제공해야 합니다.
response 필드에는 사용자를 위한 메시지를 작성하고, actions 필드에는 수행할 작업을 포함하세요.

예시 응답:
{
  "response": "키워드 상태를 활성화하였습니다.",
  "actions": [
    {
      "type": "updateStatus",
      "status": "ENABLED"
    }
  ]
}

현재는 다음 작업만 지원됩니다:
- 상태 변경(updateStatus): status 필드에 "ENABLED", "PAUSED", "REMOVED" 중 하나를 지정

사용자가 키워드를 선택하지 않았으므로, 먼저 분석할 키워드를 선택하도록 안내하세요.`;
  }
  
  // 기본 정보
  let promptContent = `당신은 광고 키워드 설정을 관리하는 실행형 챗봇입니다. 사용자의 자연어 요청을 해석하여 키워드 설정을 변경하고 상태를 바꾸는 기능을 수행합니다.
응답은 반드시 유효한 JSON 형식으로 제공해야 합니다.
response 필드에는 사용자를 위한 메시지를 작성하고, actions 필드에는 수행할 작업을 포함하세요.

예시 응답:
{
  "response": "키워드 '${keywordInfo.keyword}'의 상태를 활성화하였습니다.",
  "actions": [
    {
      "type": "updateStatus",
      "status": "ENABLED"
    }
  ]
}

현재는 다음 작업만 지원됩니다:
- 상태 변경(updateStatus): status 필드에 "ENABLED"(활성화), "PAUSED"(일시중지), "REMOVED"(삭제) 중 하나를 지정

현재 선택된 키워드 정보:
- 키워드: ${keywordInfo.keyword}
- 광고 그룹: ${keywordInfo.adGroupName}
- 캠페인: ${keywordInfo.campaignName}
`;

  // API 통신 원본 데이터 추가
  if (keywordDetailsRaw) {
    promptContent += `
아래는 해당 키워드의 현재 설정 정보입니다:
\`\`\`json
${keywordDetailsRaw}
\`\`\`

위 데이터를 바탕으로 사용자의 요청을 처리하세요. 사용자가 키워드 상태 변경을 요청하면 적절한 액션을 포함하여 응답하세요.

중요! 응답 형식:
{
  "response": "사용자에게 보여줄 응답 메시지",
  "actions": [
    { 
      "type": "updateStatus", 
      "status": "ENABLED" 
    }
  ]
}

만약 사용자의 요청이 설정 변경이 아니라 단순한 질문이나 상태 확인인 경우, actions 필드를 빈 배열로 설정하세요.
`;
  } else {
    // 원본 데이터가 없는 경우, 포맷된 정보 제공
    if (keywordDetails) {
      const criterion = keywordDetails.ad_group_criterion || {};
      const metrics = keywordDetails.metrics || {};
      
      // 입찰가
      const bidAmount = criterion.effective_cpc_bid_micros ? (criterion.effective_cpc_bid_micros / 1000000) : null;
      
      // 품질 점수
      const qualityScore = criterion.quality_info?.quality_score || null;
      
      // 상태
      const status = criterion.status || null;
      
      // 매칭 타입
      const matchType = criterion.keyword?.match_type || null;
      
      // 추가 정보 템플릿에 추가
      promptContent += `
현재 키워드의 설정 정보:`;
      
      if (matchType) promptContent += `
- 매칭 타입: ${matchType}`;
      
      if (bidAmount) promptContent += `
- 입찰가: ${bidAmount.toLocaleString()}원`;
      
      if (status) promptContent += `
- 상태: ${status}`;
      
      if (qualityScore) promptContent += `
- 품질 점수: ${qualityScore}/10`;
      
      promptContent += `

중요! 응답 형식:
{
  "response": "사용자에게 보여줄 응답 메시지",
  "actions": [
    { 
      "type": "updateStatus", 
      "status": "ENABLED" 
    }
  ]
}

만약 사용자의 요청이 설정 변경이 아니라 단순한 질문이나 상태 확인인 경우, actions 필드를 빈 배열로 설정하세요.

사용자가 상태를 변경하려고 할 때 사용할 수 있는 상태값:
- "ENABLED": 활성화
- "PAUSED": 일시중지
- "REMOVED": 삭제

사용자가 상태 변경을 요청하면(예: "키워드를 비활성화해줘", "이 키워드 일시중지 해줘" 등) 적절한 actions 배열을 포함하여 응답하세요.
`;
    }
  }
  
  return promptContent;
}

// 목(mock) 응답 생성 함수
function generateMockResponse(message: string, keywordInfo: KeywordInfo | undefined): ChatResponse {
  if (!keywordInfo) {
    return {
      response: `죄송합니다만, 현재 특정 키워드가 선택되지 않았습니다. 설정을 변경하려면 먼저 키워드를 선택해 주세요.`,
      actions: []
    };
  }
  
  const keyword = keywordInfo.keyword;
  
  // 키워드 활성화/비활성화/일시중지 요청
  if (message.includes('활성화') || message.includes('켜') || message.includes('시작')) {
    return {
      response: `'${keyword}' 키워드를 활성화했습니다.`,
      actions: [
        {
          type: 'updateStatus',
          status: 'ENABLED',
          success: true,
          message: '성공적으로 상태가 업데이트되었습니다.'
        }
      ]
    };
  }
  
  if (message.includes('비활성화') || message.includes('끄기') || message.includes('중지') || message.includes('일시중지') || message.includes('중단')) {
    return {
      response: `'${keyword}' 키워드를 일시중지했습니다.`,
      actions: [
        {
          type: 'updateStatus',
          status: 'PAUSED',
          success: true,
          message: '성공적으로 상태가 업데이트되었습니다.'
        }
      ]
    };
  }
  
  if (message.includes('삭제') || message.includes('제거')) {
    return {
      response: `'${keyword}' 키워드를 삭제했습니다.`,
      actions: [
        {
          type: 'updateStatus',
          status: 'REMOVED',
          success: true,
          message: '성공적으로 상태가 업데이트되었습니다.'
        }
      ]
    };
  }
  
  // 상태 확인 요청
  if (message.includes('상태') || message.includes('상황') || message.includes('설정')) {
    return {
      response: `'${keyword}' 키워드의 현재 상태는 '활성화'입니다. 상태를 변경하시려면 "키워드를 일시중지해줘"와 같이 요청하세요.`,
      actions: []
    };
  }
  
  return {
    response: `'${keyword}' 키워드의 설정을 변경하시려면 다음과 같이 요청해 주세요:
- "키워드를 활성화해줘"
- "키워드를 일시중지해줘" 
- "키워드를 삭제해줘"`,
    actions: []
  };
} 