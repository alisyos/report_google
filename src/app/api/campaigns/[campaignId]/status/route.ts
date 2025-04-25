import { NextRequest, NextResponse } from 'next/server';
import { updateCampaignStatus } from '@/lib/googleAds';

export async function PUT(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const { campaignId } = params;
    const body = await request.json();
    const { status } = body;

    if (!campaignId) {
      return NextResponse.json(
        { message: '캠페인 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { message: '업데이트할 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`캠페인 ID ${campaignId}의 상태를 ${status}(으)로 업데이트 요청 받음`);

    const result = await updateCampaignStatus(campaignId, status);
    
    if (result.success === false) {
      return NextResponse.json(
        { message: result.message || '캠페인 상태 업데이트 실패' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '캠페인 상태가 성공적으로 업데이트되었습니다.',
      data: result.message
    });
  } catch (error: any) {
    console.error('캠페인 상태 업데이트 중 오류 발생:', error);
    return NextResponse.json(
      { message: error.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 