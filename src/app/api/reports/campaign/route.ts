import { NextResponse } from 'next/server';
import { getCampaignPerformanceReport } from '@/lib/googleAds';

export async function GET(request: Request) {
  // URL에서 쿼리 파라미터 추출
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || '2023-01-01';
  const endDate = searchParams.get('endDate') || '2023-12-31';

  console.log(`캠페인 성과 보고서 요청: 기간 ${startDate} ~ ${endDate}`);

  try {
    // Google Ads API에서 캠페인 성과 데이터 가져오기
    const response = await getCampaignPerformanceReport(startDate, endDate);
    
    // 응답 데이터 로깅
    console.log(`API에서 ${response.length}개 항목 수신`);
    if (response.length > 0) {
      console.log('첫 번째 항목 샘플:', JSON.stringify(response[0]).substring(0, 200));
      
      // 비용 로깅 - cost_micros 또는 costMicros 확인
      const costField = response[0].metrics?.cost_micros !== undefined ? 'cost_micros' : 
                      (response[0].metrics?.costMicros !== undefined ? 'costMicros' : null);
      
      if (costField) {
        const originalCost = response[0].metrics[costField];
        console.log(`원본 ${costField}: ${originalCost}, 변환된 비용: ${Number(originalCost) / 1000000}`);
      }
    }

    // 클라이언트용 보고서 형식 지정
    const formattedReport = response.map(item => {
      // cost_micros 또는 costMicros 필드에서 비용 계산
      let cost = 0;
      if (item.metrics?.cost_micros !== undefined) {
        cost = Number(item.metrics.cost_micros) / 1000000;
      } else if (item.metrics?.costMicros !== undefined) {
        cost = Number(item.metrics.costMicros) / 1000000;
      }

      return {
        id: item.campaign?.id || '',
        name: item.campaign?.name || '',
        status: item.campaign?.status || '',
        impressions: Number(item.metrics?.impressions) || 0,
        clicks: Number(item.metrics?.clicks) || 0,
        cost: cost,
        conversions: Number(item.metrics?.conversions) || 0,
        ctr: Number(item.metrics?.ctr) || 0,
      };
    });

    return NextResponse.json({ 
      success: true, 
      report: formattedReport 
    });
  } catch (error) {
    console.error('캠페인 성과 보고서 가져오기 오류:', error);
    return NextResponse.json({ 
      success: false, 
      message: '캠페인 성과 보고서를 가져오는 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 