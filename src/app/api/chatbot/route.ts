import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getKeywordDetails } from '@/lib/googleAds';

interface KeywordInfo {
  id: string;
  keyword: string;
  adGroupId: string;
  adGroupName: string;
  campaignId: string;
  campaignName: string;
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
      return NextResponse.json({ response: mockResponse });
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
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    console.log('OpenAI API 응답 받음:', {
      assistantMessage: response.choices[0].message.content,
      usage: response.usage,
    });
    
    const assistantResponse = response.choices[0].message.content || '응답을 생성할 수 없습니다';
    
    console.log('========== 챗봇 API 요청 완료 ==========');
    return NextResponse.json({ response: assistantResponse });
    
  } catch (error) {
    console.error('챗봇 API 요청 처리 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}

// 시스템 프롬프트 생성 함수
function generateSystemPrompt(keywordInfo: KeywordInfo | undefined, keywordDetails: any = null, keywordDetailsRaw: string | null = null): string {
  if (!keywordInfo) {
    return `당신은 광고 키워드 관리를 도와주는 챗봇입니다. 주어진 정보를 기반으로 사용자의 질문에 친절하고 전문적으로 답변해 주세요.`;
  }
  
  // 기본 정보
  let promptContent = `당신은 광고 키워드 관리를 도와주는 챗봇입니다. 사용자의 질문에 친절하고 전문적으로 답변해 주세요.
  
현재 선택된 키워드 정보:
- 키워드: ${keywordInfo.keyword}
- 광고 그룹: ${keywordInfo.adGroupName}
- 캠페인: ${keywordInfo.campaignName}
`;

  // API 통신 원본 데이터 추가
  if (keywordDetailsRaw) {
    promptContent += `
아래는 Google Ads API에서 가져온 키워드 상세 정보 원본 데이터입니다:
\`\`\`json
${keywordDetailsRaw}
\`\`\`

위 원본 데이터를 바탕으로 응답해주세요. 원본 데이터에는 다음과 같은 정보가 포함될 수 있습니다:
- campaign: 캠페인 정보 (resourceName, name, id 등)
- adGroup: 광고 그룹 정보 (resourceName, id, name 등)
- metrics: 성과 지표 (clicks, conversions, costMicros, impressions 등)
- adGroupCriterion: 키워드 설정 정보 (resourceName, status, qualityInfo, keyword 정보, criterionId, effectiveCpcBidMicros 등)
- keywordView: 키워드 뷰 정보 (resourceName 등)

이 키워드의 성과 및 설정 데이터를 분석하여 아래와 같은 내용을 포함해 답변해주세요:
`;
  } else {
    // 원본 데이터가 없는 경우, 포맷된 정보 제공
    if (keywordDetails) {
      const criterion = keywordDetails.ad_group_criterion || {};
      const metrics = keywordDetails.metrics || {};
      
      // 입찰가 (마이크로 단위를 원 단위로 변환)
      const bidAmount = criterion.effective_cpc_bid_micros ? (criterion.effective_cpc_bid_micros / 1000000) : null;
      
      // 품질 점수
      const qualityScore = criterion.quality_info?.quality_score || null;
      
      // 상태
      const status = criterion.status || null;
      
      // 매칭 타입
      const matchType = criterion.keyword?.match_type || null;
      
      // 노출 수
      const impressions = metrics.impressions || null;
      
      // 클릭 수
      const clicks = metrics.clicks || null;
      
      // 클릭률 (CTR)
      const ctr = metrics.ctr ? (metrics.ctr * 100) : null;
      
      // 평균 CPC (마이크로 단위를 원 단위로 변환)
      const averageCpc = metrics.average_cpc ? (metrics.average_cpc / 1000) : null;
      
      // 전환 수
      const conversions = metrics.conversions || null;
      
      // 추가 정보 템플릿에 추가
      promptContent += `
키워드 상세 설정 정보:`;
      
      if (matchType) promptContent += `
- 매칭 타입: ${matchType}`;
      
      if (bidAmount) promptContent += `
- 입찰가: ${bidAmount.toLocaleString()}원`;
      
      if (status) promptContent += `
- 상태: ${status}`;
      
      if (qualityScore) promptContent += `
- 품질 점수: ${qualityScore}/10`;
      
      if (impressions || clicks || ctr || averageCpc || conversions) {
        promptContent += `

키워드 성과 정보:`;
        
        if (impressions) promptContent += `
- 노출 수: ${impressions.toLocaleString()}회`;
        
        if (clicks) promptContent += `
- 클릭 수: ${clicks.toLocaleString()}회`;
        
        if (ctr) promptContent += `
- 클릭률(CTR): ${ctr.toFixed(2)}%`;
        
        if (averageCpc) promptContent += `
- 평균 클릭 비용(CPC): ${averageCpc.toLocaleString()}원`;
        
        if (conversions) promptContent += `
- 전환 수: ${conversions.toLocaleString()}회`;
      }
    }
  }
  
  promptContent += `
1. 키워드 성과 분석: 노출 수, 클릭 수, 전환 수 등을 분석
2. 품질 점수 분석: 현재 품질 점수와 개선 방안
3. 입찰가 전략: 현재 입찰가의 적정성과 조정 방안
4. 키워드 매칭 타입: 현재 설정된 매칭 타입의 영향과 변경 여부 검토
5. 최적화 제안: 성과를 높이기 위한 구체적인 조치 사항

사용자의 질문에 따라 위 정보를 참고하여 전문적인 조언을 제공해주세요.
`;

  return promptContent;
}

// 목(mock) 응답 생성 함수
function generateMockResponse(message: string, keywordInfo: KeywordInfo | undefined): string {
  if (!keywordInfo) {
    return `죄송합니다만, 현재 특정 키워드가 선택되지 않았습니다. 분석을 위해 키워드를 먼저 선택해 주세요.`;
  }
  
  const keyword = keywordInfo.keyword;
  
  if (message.includes('성과') || message.includes('실적') || message.includes('결과')) {
    return `'${keyword}' 키워드는 최근 30일 동안 약 5,200회 노출되었으며, 클릭률은 3.2%입니다. 평균 광고 순위는 2.5위이고, 평균 CPC는 850원입니다. 전환율은 약 2.1%로, 업계 평균인 1.8%보다 높습니다.`;
  }
  
  if (message.includes('개선') || message.includes('최적화') || message.includes('향상')) {
    return `'${keyword}' 키워드의 성과를 개선하기 위해 다음을 제안합니다:
1. 광고 문구에 '${keyword}'를 명시적으로 포함시켜 관련성을 높이세요.
2. 현재 입찰가가 경쟁사보다 약간 낮으므로, 10-15% 인상을 고려해 보세요.
3. 랜딩 페이지에 '${keyword}' 관련 콘텐츠를 더 추가하여 품질 점수를 향상시키세요.
4. 부정 키워드 목록을 검토하여 불필요한 노출을 줄이세요.`;
  }
  
  if (message.includes('추천') || message.includes('제안') || message.includes('조언')) {
    return `'${keyword}'와 함께 고려할 만한 추가 키워드로는 '${keyword} 가격', '${keyword} 리뷰', '최고의 ${keyword}', '${keyword} 할인' 등이 있습니다. 또한 경쟁이 적은 롱테일 키워드인 '${keyword} 사용법', '${keyword} 문제해결', '${keyword} vs 경쟁제품' 등을 추가하면 전환율을 높일 수 있습니다.`;
  }
  
  if (message.includes('경쟁사') || message.includes('경쟁력') || message.includes('비교')) {
    return `'${keyword}' 키워드에서는 현재 3개의 주요 경쟁사가 광고를 집행 중입니다. 평균 입찰가는 950원 수준이며, 귀사의 광고는 품질 점수는 7/10으로 경쟁사 평균(6/10)보다 높습니다. 경쟁사들은 주로 할인과 무료 배송 혜택을 강조하고 있으니, 차별화된 가치 제안이 필요합니다.`;
  }
  
  if (message.includes('설정') || message.includes('설정값')) {
    return `'${keyword}' 키워드의 현재 설정값은 다음과 같습니다:
- 매칭 타입: 정확히 일치
- 입찰가: 1,000원
- 상태: 활성화됨
- 품질 점수: 7/10
- 광고 그룹: ${keywordInfo.adGroupName}
- 캠페인: ${keywordInfo.campaignName}`;
  }
  
  return `'${keyword}' 키워드에 대해 어떤 정보가 필요하신가요? 성과 분석, 최적화 전략, 유사 키워드 추천, 경쟁사 분석, 설정값 정보 등에 대해 도움을 드릴 수 있습니다.`;
} 