import { NextResponse } from 'next/server';
import { getKeywordPerformanceReport } from '@/lib/googleAds';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || '2023-01-01';
  const endDate = searchParams.get('endDate') || '2023-12-31';

  try {
    const report = await getKeywordPerformanceReport(startDate, endDate);
    
    console.log('키워드 API 응답 원본 데이터 예시:', report.length > 0 ? JSON.stringify(report[0], null, 2) : '데이터 없음');
    
    // 마이크로 단위 비용을 실제 화폐 단위로 변환
    const formattedReport = report.map((item: any) => {
      const costMicros = item.metrics?.cost_micros;
      console.log(`키워드 비용 마이크로 값: ${costMicros}, 타입: ${typeof costMicros}`);
      
      // 비용을 올바르게 변환 (문자열을 숫자로 변환 후 백만으로 나눔)
      const convertedCost = costMicros ? Number(costMicros) / 1000000 : 0;
      console.log(`키워드 변환된 비용: ${convertedCost}`);
      
      return {
        keyword: item.ad_group_criterion?.keyword?.text || '',
        campaignName: item.campaign?.name || '',
        adGroupName: item.ad_group?.name || '',
        impressions: Number(item.metrics?.impressions) || 0,
        clicks: Number(item.metrics?.clicks) || 0,
        cost: convertedCost,
        conversions: Number(item.metrics?.conversions) || 0,
        ctr: Number(item.metrics?.ctr) || 0,
      };
    });

    return NextResponse.json({ data: formattedReport });
  } catch (error: any) {
    console.error('키워드 리포트 API 오류:', error.message);
    return NextResponse.json(
      { error: error.message || '키워드 리포트를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 