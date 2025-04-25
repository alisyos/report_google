import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions';

interface KeywordInfo {
  id: string;
  keyword: string;
  adGroupId: string;
  adGroupName: string;
  campaignId: string;
  campaignName: string;
  matchType?: string;
  bidAmount?: number;
  status?: string;
  qualityScore?: number;
  averageCpc?: number;
  clicks?: number;
  impressions?: number;
  conversions?: number;
  ctr?: number;
}

export async function POST(request: NextRequest) {
  try {
    // 요청 데이터 파싱
    const reqData = await request.json();
    const { message, keywordInfo } = reqData;

    if (!message) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      console.warn('OpenAI API 키가 설정되지 않았습니다. 임시 응답을 반환합니다.');
      return NextResponse.json({
        response: generateMockResponse(message, keywordInfo)
      });
    }

    // API 요청 준비
    const systemPrompt = generateSystemPrompt(keywordInfo);
    
    // OpenAI API 요청
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // 또는 'gpt-4' 가능
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API 오류:', data);
      return NextResponse.json(
        { error: '챗봇 응답을 생성하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const assistantResponse = data.choices[0]?.message?.content;
    
    return NextResponse.json({ response: assistantResponse });
  } catch (error: any) {
    console.error('챗봇 API 오류:', error);
    return NextResponse.json(
      { error: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// System 프롬프트 생성
function generateSystemPrompt(keywordInfo: KeywordInfo | undefined): string {
  if (!keywordInfo) {
    return `
      당신은 Google Ads 키워드 관리를 도와주는 챗봇입니다.
      사용자가 키워드를 선택하지 않았습니다. 키워드를 선택하도록 안내해 주세요.
      답변은 간결하고 전문적으로 제공하세요.
    `;
  }

  return `
    당신은 Google Ads 키워드 관리를 도와주는 챗봇입니다.
    다음 키워드 정보를 바탕으로 사용자의 질문에 답변해주세요:
    
    - 키워드 ID: ${keywordInfo.id}
    - 키워드: ${keywordInfo.keyword}
    - 광고 그룹: ${keywordInfo.adGroupName}
    - 캠페인: ${keywordInfo.campaignName}
    - 매칭 타입: ${keywordInfo.matchType || '정확히 일치'}
    - 입찰가: ${keywordInfo.bidAmount || '2,500'}원
    - 상태: ${keywordInfo.status || '활성'}
    - 품질 점수: ${keywordInfo.qualityScore || '7'}/10
    - 평균 CPC: ${keywordInfo.averageCpc || '1,800'}원
    - 클릭 수: ${keywordInfo.clicks || '78'}
    - 노출 수: ${keywordInfo.impressions || '1,245'}
    - 전환 수: ${keywordInfo.conversions || '12'}
    - CTR: ${keywordInfo.ctr || '6.3'}%
    
    답변은 간결하고 전문적으로 제공하세요.
    키워드 성과, 입찰가, 품질 점수, 설정 변경 방법 등에 대해 질문할 수 있습니다.
    사용자에게 이 키워드의 성과를 개선하기 위한 팁을 제공하세요.
  `;
}

// API 키가 설정되지 않았을 때 임시 응답 생성
function generateMockResponse(message: string, keywordInfo?: KeywordInfo): string {
  if (!keywordInfo) {
    return '키워드를 선택해 주세요. 키워드 정보가 없으면 자세한 정보를 제공할 수 없습니다.';
  }

  // 메시지 내용에 따른 다양한 응답
  if (message.toLowerCase().includes('입찰가') || message.toLowerCase().includes('비용') || message.toLowerCase().includes('가격')) {
    return `"${keywordInfo.keyword}" 키워드의 현재 입찰가는 2,500원입니다. 지난 7일 평균 클릭당 비용(CPC)은 1,800원이었습니다.`;
  } else if (message.toLowerCase().includes('성과') || message.toLowerCase().includes('클릭') || message.toLowerCase().includes('전환')) {
    return `"${keywordInfo.keyword}" 키워드는 지난 30일 동안 1,245회 노출되었고, 78회 클릭되었습니다. 클릭률(CTR)은 6.3%이며, 12회의 전환이 발생했습니다.`;
  } else if (message.toLowerCase().includes('품질점수') || message.toLowerCase().includes('품질 점수')) {
    return `"${keywordInfo.keyword}" 키워드의 현재 품질점수는 7/10입니다. 광고 관련성을 높이면 점수를 향상시킬 수 있습니다.`;
  } else if (message.toLowerCase().includes('변경') || message.toLowerCase().includes('수정') || message.toLowerCase().includes('업데이트')) {
    return `"${keywordInfo.keyword}" 키워드의 설정을 변경하려면 어떤 부분을 수정하고 싶으신가요? 입찰가, 매칭타입, 상태 등을 변경할 수 있습니다.`;
  } else {
    return `"${keywordInfo.keyword}" 키워드에 대해 더 구체적인 질문을 해주세요. 입찰가, 성과 데이터, 품질점수 등에 대해 물어보실 수 있습니다.`;
  }
} 