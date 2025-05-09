import { NextResponse } from 'next/server';
import { getKeywordPerformanceReport } from '@/lib/googleAds';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // 날짜 범위 파라미터 (기본값: 2023년 전체)
  const startDate = searchParams.get('startDate') || '2023-01-01';
  const endDate = searchParams.get('endDate') || '2023-12-31';
  
  // 필터링 파라미터
  const keywordId = searchParams.get('keywordId');
  const adGroupId = searchParams.get('adGroupId');
  const campaignId = searchParams.get('campaignId');
  
  console.log(`키워드 성과 리포트 요청: ${startDate} ~ ${endDate}`);
  if (keywordId) console.log(`키워드 ID: ${keywordId}`);
  if (adGroupId) console.log(`광고 그룹 ID: ${adGroupId}`);
  if (campaignId) console.log(`캠페인 ID: ${campaignId}`);
  
  // 필터링 파라미터 중 하나 이상이 제공되었는지 확인
  const hasFilter = !!(keywordId || adGroupId || campaignId);
  if (!hasFilter) {
    console.log('경고: 필터 파라미터가 제공되지 않았습니다. 데이터가 많을 수 있습니다.');
  }
  
  try {
    // Google Ads API에서 키워드 성과 데이터 가져오기
    const report = await getKeywordPerformanceReport(
      startDate, 
      endDate, 
      keywordId || null, 
      adGroupId || null, 
      campaignId || null
    );
    
    console.log(`키워드 API 응답 받음: ${report.length}개 항목`);
    if (report.length > 0) {
      console.log('첫 번째 항목 샘플:', JSON.stringify(report[0]).substring(0, 200) + '...');
      
      // 필드 구조 로깅
      const metricsKeys = report[0].metrics ? Object.keys(report[0].metrics) : [];
      console.log('metrics 필드:', metricsKeys.join(', '));
      
      // 비용 필드 로깅
      if (report[0].metrics?.cost_micros !== undefined) {
        console.log(`원본 cost_micros: ${report[0].metrics.cost_micros}, 변환된 비용: ${Number(report[0].metrics.cost_micros) / 1000000}`);
      }
    }
    
    // API 응답 데이터 변환
    const formattedReport = report.map((item: any) => {
      // console.log('Item structure:', JSON.stringify(item, null, 2));
      
      // cost 처리 - cost_micros 필드 찾기
      let cost = 0;
      if (item.metrics?.cost_micros !== undefined) {
        cost = Number(item.metrics.cost_micros) / 1000000;
      } else if (item.metrics?.costMicros !== undefined) {
        cost = Number(item.metrics.costMicros) / 1000000;
      }
      
      // Google Ads API v19 응답 구조 처리
      const criterionId = item.adGroupCriterion?.criterionId || item.ad_group_criterion?.criterion_id || '';
      const keywordText = item.adGroupCriterion?.keyword?.text || item.ad_group_criterion?.keyword?.text || '';
      const matchType = item.adGroupCriterion?.keyword?.matchType || item.ad_group_criterion?.keyword?.match_type || '';
      
      // AdGroup ID와 이름 처리
      const adGroupId = item.adGroup?.id || item.ad_group?.id || '';
      const adGroupName = item.adGroup?.name || item.ad_group?.name || '';
      
      return {
        id: criterionId,
        keyword: keywordText, // 'text' 대신 'keyword'로 매핑
        text: keywordText,    // 기존 호환성 유지
        matchType: matchType,
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
    
    console.log(`${formattedReport.length}개의 키워드 리포트 데이터를 반환합니다.`);
    return NextResponse.json({ 
      success: true,
      report: formattedReport 
    });
  } catch (error: any) {
    console.error('키워드 리포트 가져오기 오류:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || '키워드 성과 데이터를 가져오는 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 