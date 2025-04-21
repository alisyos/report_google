import { NextResponse } from 'next/server';
import { getAdGroups } from '@/lib/googleAds';

// AdGroup 인터페이스 정의
interface AdGroupItem {
  adGroup?: { id: string; name: string; resourceName?: string };
  campaign?: { id: string; name: string; resourceName?: string };
}

// API 경로 핸들러: GET /api/adgroups
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId') || null;
  
  console.log('GET /api/adgroups 요청 받음', campaignId ? `캠페인 ID: ${campaignId}` : '전체 광고 그룹');
  
  try {
    const adGroups = await getAdGroups(campaignId || undefined);
    
    // API 응답 데이터 샘플 로깅
    if (adGroups.length > 0) {
      console.log('API 응답 데이터 샘플:', JSON.stringify(adGroups[0], null, 2));
    }
    
    // 클라이언트에서 기대하는 형식으로 변환
    const formattedAdGroups = adGroups.map((item: any) => ({
      id: item.adGroup?.id || '',
      name: item.adGroup?.name || '',
      campaignId: item.campaign?.id || '',
      campaignName: item.campaign?.name || ''
    }));
    
    console.log(`${formattedAdGroups.length}개의 광고 그룹 데이터 반환`);
    return NextResponse.json({ data: formattedAdGroups });
  } catch (error: any) {
    console.error('광고 그룹 데이터 가져오기 오류:', error);
    return NextResponse.json(
      { error: error.message || '광고 그룹 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 