import { NextResponse } from 'next/server';
import { getCampaigns, getAdGroups } from '@/lib/googleAds';

/**
 * 캠페인 상세 정보 API 엔드포인트
 * GET /api/campaign-details?campaignId=123456789
 * 
 * 지정된 캠페인 ID의 상세 정보와 해당 캠페인의 광고 그룹 목록을 함께 반환합니다.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');

  console.log(`GET /api/campaign-details 요청 받음. 캠페인 ID: ${campaignId}`);
  
  if (!campaignId) {
    return NextResponse.json(
      { error: '캠페인 ID가 필요합니다' },
      { status: 400 }
    );
  }

  try {
    // 1. 먼저 모든 캠페인을 가져옴
    const allCampaigns = await getCampaigns();
    
    // 2. 요청된 캠페인 ID에 해당하는 캠페인 찾기
    const campaign = allCampaigns.find(
      (camp: any) => camp.campaign?.id === campaignId
    );
    
    if (!campaign) {
      return NextResponse.json(
        { error: '해당 ID의 캠페인을 찾을 수 없습니다' },
        { status: 404 }
      );
    }
    
    // 3. 캠페인 정보 구조화
    const campaignDetails = {
      id: campaign.campaign?.id || '',
      name: campaign.campaign?.name || '',
      status: campaign.campaign?.status || '',
      budget: campaign.campaign_budget?.amount_micros 
        ? Number(campaign.campaign_budget.amount_micros) / 1000000 
        : 0
    };
    
    // 4. 캠페인의 광고 그룹 가져오기
    const adGroups = await getAdGroups(campaignId);
    
    // 5. 광고 그룹 정보 구조화
    const formattedAdGroups = adGroups.map((item: any) => ({
      id: item.ad_group?.id || '',
      name: item.ad_group?.name || '',
      campaignId: item.campaign?.id || '',
      campaignName: item.campaign?.name || ''
    }));
    
    console.log(`캠페인 상세 정보 및 ${formattedAdGroups.length}개의 광고 그룹 데이터 반환`);
    
    // 6. 캠페인 정보와 광고 그룹 목록을 함께 반환
    return NextResponse.json({ 
      data: {
        campaign: campaignDetails,
        adGroups: formattedAdGroups
      }
    });
  } catch (error: any) {
    console.error('캠페인 상세 정보 가져오기 오류:', error);
    return NextResponse.json(
      { error: error.message || '캠페인 상세 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 