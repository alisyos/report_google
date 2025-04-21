import { NextResponse } from 'next/server';
import { getKeywordsByAdGroup } from '@/lib/googleAds';

/**
 * 키워드 API 엔드포인트
 * GET /api/keywords
 * 
 * 특정 광고 그룹의 키워드 목록을 가져옵니다.
 * 
 * 쿼리 파라미터:
 * - adGroupId: 키워드를 가져올 광고 그룹 ID
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const adGroupId = searchParams.get('adGroupId');
  
  if (!adGroupId) {
    return NextResponse.json(
      { error: '광고 그룹 ID가 필요합니다.' },
      { status: 400 }
    );
  }
  
  console.log(`GET /api/keywords 요청 받음, 광고 그룹 ID: ${adGroupId}`);
  
  try {
    const keywords = await getKeywordsByAdGroup(adGroupId);
    
    // API 응답 데이터 샘플 로깅
    if (keywords.length > 0) {
      console.log('키워드 API 응답 데이터 샘플:', JSON.stringify(keywords[0], null, 2));
    }
    
    // 클라이언트에서 사용하기 쉬운 형식으로 데이터 변환
    const formattedKeywords = keywords.map((item: any) => {
      // 로깅을 통해 실제 데이터 구조 확인
      console.log('매핑할 항목 구조:', JSON.stringify({
        criterion_id: item.adGroupCriterion?.criterionId || '없음',
        keyword_text: item.adGroupCriterion?.keyword?.text || '없음',
        ad_group_id: item.adGroup?.id || '없음',
        ad_group_name: item.adGroup?.name || '없음'
      }, null, 2));
      
      return {
        id: item.adGroupCriterion?.criterionId || '',
        keyword: item.adGroupCriterion?.keyword?.text || '',
        adGroupId: item.adGroup?.id || '',
        adGroupName: item.adGroup?.name || '',
        campaignId: item.campaign?.id || '',
        campaignName: item.campaign?.name || ''
      };
    });
    
    console.log(`${formattedKeywords.length}개의 키워드 데이터 반환`);
    return NextResponse.json({ data: formattedKeywords });
  } catch (error: any) {
    console.error('키워드 데이터 가져오기 오류:', error);
    return NextResponse.json(
      { error: error.message || '키워드 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 