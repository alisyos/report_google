import { NextResponse } from 'next/server';
import { getCampaignDailyPerformanceReport } from '@/lib/googleAds';

/**
 * 캠페인 일별 성과 보고서 API 엔드포인트
 * GET /api/reports/campaign/daily
 * 
 * 특정 캠페인의 일별 성과 데이터를 제공합니다.
 * 
 * 쿼리 파라미터:
 * - startDate: 시작일 (YYYY-MM-DD)
 * - endDate: 종료일 (YYYY-MM-DD)
 * - campaignId: 캠페인 ID (필수)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || '2023-01-01';
  const endDate = searchParams.get('endDate') || '2023-12-31';
  const campaignId = searchParams.get('campaignId');

  // 캠페인 ID가 제공되지 않은 경우 에러 응답
  if (!campaignId) {
    return NextResponse.json(
      { error: '캠페인 ID가 필요합니다.' },
      { status: 400 }
    );
  }

  console.log(`일별 캠페인 리포트 요청: 캠페인 ID ${campaignId}, 기간 ${startDate} ~ ${endDate}`);

  try {
    const report = await getCampaignDailyPerformanceReport(startDate, endDate, campaignId);
    
    // API 응답 데이터의 상세 구조 로깅 (더 자세한 로깅)
    if (report.length > 0) {
      const firstItem = report[0];
      console.log('API 응답 데이터 구조 상세 분석:', {
        메트릭스: firstItem.metrics ? Object.keys(firstItem.metrics) : '없음',
        'metrics 내부 타입': firstItem.metrics ? typeof firstItem.metrics : '해당 없음',
        'costMicros 필드': firstItem.metrics?.costMicros,
        '전체 metrics 객체': JSON.stringify(firstItem.metrics)
      });
    }
    
    // 데이터 가공
    const formattedReport = report.map((item: any) => {
      // costMicros 필드 사용
      const costMicros = item.metrics?.costMicros;
      
      // 비용 데이터 타입 및 값 상세 로깅
      console.log(`원본 비용 데이터(costMicros): ${costMicros}`);
      console.log(`비용 데이터 타입: ${typeof costMicros}`);
      
      // costMicros가 문자열이든 숫자든 상관없이 변환
      let convertedCost = 0;
      if (costMicros !== undefined && costMicros !== null) {
        // 문자열에서 숫자로 변환하고 마이크로 단위(백만분의 1)를 적용
        convertedCost = Number(costMicros) / 1000000;
        console.log(`변환된 비용: ${convertedCost}`);
      } else {
        console.log('비용 데이터가 없습니다.');
      }
      
      return {
        id: item.campaign?.id || '',
        name: item.campaign?.name || '',
        date: item.segments?.date || '',
        impressions: Number(item.metrics?.impressions) || 0,
        clicks: Number(item.metrics?.clicks) || 0,
        cost: convertedCost,
        conversions: Number(item.metrics?.conversions) || 0,
        ctr: Number(item.metrics?.ctr) || 0,
      };
    });

    console.log(`${formattedReport.length}개의 일별 캠페인 데이터 반환`);
    return NextResponse.json({ data: formattedReport });
  } catch (error: any) {
    console.error('일별 캠페인 리포트 가져오기 오류:', error);
    return NextResponse.json(
      { error: error.message || '일별 캠페인 리포트를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 