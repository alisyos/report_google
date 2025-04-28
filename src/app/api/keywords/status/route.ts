import { NextRequest, NextResponse } from 'next/server';
import { updateKeywordStatus } from '@/lib/googleAds';

export async function PUT(request: NextRequest) {
  try {
    // 요청 본문에서 필요한 데이터 추출
    const { keywordId, adGroupId, status } = await request.json();
    
    // 필수 파라미터 검증
    if (!keywordId) {
      return NextResponse.json(
        { error: '키워드 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    if (!adGroupId) {
      return NextResponse.json(
        { error: '광고 그룹 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    if (!status) {
      return NextResponse.json(
        { error: '변경할 상태값이 필요합니다.' },
        { status: 400 }
      );
    }
    
    console.log(`키워드 상태 변경 요청: keywordId=${keywordId}, adGroupId=${adGroupId}, status=${status}`);
    
    // 키워드 상태 업데이트 함수 호출
    const result = await updateKeywordStatus(keywordId, adGroupId, status);
    
    if (result.success) {
      return NextResponse.json(
        { 
          success: true, 
          message: result.message 
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.message 
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('키워드 상태 업데이트 API 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `오류 발생: ${error.message || '알 수 없는 오류'}` 
      },
      { status: 500 }
    );
  }
} 