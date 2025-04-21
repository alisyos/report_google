import { NextResponse } from 'next/server';
import { getCampaigns } from '@/lib/googleAds';

/**
 * 캠페인 API 엔드포인트
 * GET /api/campaigns
 * 
 * 구글 광고 계정의 모든 캠페인 목록을 가져옵니다.
 */
export async function GET() {
  console.log('GET /api/campaigns 요청 받음');
  
  try {
    const campaigns = await getCampaigns();
    
    // API 응답 데이터 샘플 로깅
    if (campaigns.length > 0) {
      console.log('캠페인 데이터 샘플:', JSON.stringify(campaigns[0], null, 2));
    }
    
    // 클라이언트에서 사용하기 쉬운 형식으로 데이터 변환
    const formattedCampaigns = campaigns.map((item: any) => ({
      id: item.campaign?.id || '',
      name: item.campaign?.name || '',
      status: item.campaign?.status || '',
      budget: item.campaign_budget?.amount_micros 
        ? Number(item.campaign_budget.amount_micros) / 1000000 
        : 0
    }));
    
    console.log(`${formattedCampaigns.length}개의 캠페인 데이터 반환`);
    return NextResponse.json({ data: formattedCampaigns });
  } catch (error: any) {
    console.error('캠페인 데이터 가져오기 오류:', error);
    return NextResponse.json(
      { error: error.message || '캠페인 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 