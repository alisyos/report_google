import { NextResponse } from 'next/server';
import { getKeywordDailyPerformanceReport } from '@/lib/googleAds';

/**
 * 키워드 일별 성과 보고서 API 엔드포인트
 * 
 * Query Parameters:
 * - startDate: 시작일 (YYYY-MM-DD 형식, 기본값: 당해 연도 1월 1일)
 * - endDate: 종료일 (YYYY-MM-DD 형식, 기본값: 당해 연도 12월 31일)
 * - keywordId: 필수 - 키워드 ID
 * - campaignId: 선택적 - 캠페인 ID로 필터링
 * - adGroupId: 선택적 - 광고 그룹 ID로 필터링
 * 
 * 성과 데이터를 일별로 제공합니다.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  
  // URL에서 쿼리 파라미터 추출
  const startDate = searchParams.get('startDate') || '2023-01-01';
  const endDate = searchParams.get('endDate') || '2023-12-31';
  const keywordId = searchParams.get('keywordId');
  const campaignId = searchParams.get('campaignId');
  const adGroupId = searchParams.get('adGroupId');
  
  console.log(`키워드 일별 성과 리포트 API 호출:`);
  console.log(`- 기간: ${startDate} ~ ${endDate}`);
  console.log(`- 키워드 ID: ${keywordId || '지정되지 않음'}`);
  console.log(`- 캠페인 ID: ${campaignId || '지정되지 않음'}`);
  console.log(`- 광고 그룹 ID: ${adGroupId || '지정되지 않음'}`);
  
  // 필수 매개변수 검증
  if (!keywordId) {
    return NextResponse.json({ 
      success: false, 
      message: '키워드 ID(keywordId)는 필수 매개변수입니다.' 
    }, { status: 400 });
  }
  
  try {
    // Google Ads API에서 키워드 일별 성과 데이터 가져오기
    const report = await getKeywordDailyPerformanceReport(
      startDate, 
      endDate, 
      keywordId,
      campaignId || null, 
      adGroupId || null
    );
    
    console.log(`키워드 일별 성과 데이터 수신: ${report.length}개 항목`);
    if (report.length > 0) {
      console.log('첫 번째 항목 샘플:', JSON.stringify(report[0]).substring(0, 200) + '...');
    }
    
    // API 응답 데이터 변환
    const formattedReport = report.map((item: any) => {
      // cost 처리 - cost_micros 필드 찾기
      let cost = 0;
      if (item.metrics?.cost_micros !== undefined) {
        cost = Number(item.metrics.cost_micros) / 1000000;
      } else if (item.metrics?.costMicros !== undefined) {
        cost = Number(item.metrics.costMicros) / 1000000;
      }
      
      // Google Ads API 응답 구조 처리
      const criterionId = item.adGroupCriterion?.criterionId || item.ad_group_criterion?.criterion_id || '';
      const keywordText = item.adGroupCriterion?.keyword?.text || item.ad_group_criterion?.keyword?.text || '';
      const matchType = item.adGroupCriterion?.keyword?.matchType || item.ad_group_criterion?.keyword?.match_type || '';
      
      // AdGroup ID와 이름 처리
      const adGroupId = item.adGroup?.id || item.ad_group?.id || '';
      const adGroupName = item.adGroup?.name || item.ad_group?.name || '';
      
      // 날짜 필드 처리 (여러 가능한 필드명 체크)
      const date = item.segments?.date || item.segments?.day || '';
      
      return {
        id: criterionId,
        keyword: keywordText,
        text: keywordText,    // 기존 호환성 유지
        matchType: matchType,
        date: date,
        campaignId: item.campaign?.id || '',
        campaignName: item.campaign?.name || '',
        adGroupId: adGroupId,
        adGroupName: adGroupName,
        impressions: Number(item.metrics?.impressions) || 0,
        clicks: Number(item.metrics?.clicks) || 0,
        cost: cost,
        conversions: Number(item.metrics?.conversions) || 0,
        ctr: Number(item.metrics?.ctr) || 0
      };
    });
    
    console.log(`${formattedReport.length}개의 키워드 일별 리포트 데이터를 반환합니다.`);
    return NextResponse.json({ 
      success: true,
      report: formattedReport 
    });
  } catch (error: any) {
    console.error('키워드 일별 리포트 가져오기 오류:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || '키워드 일별 성과 데이터를 가져오는 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 