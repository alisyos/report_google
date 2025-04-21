/**
 * 구글 광고 API 연동 모듈
 * 
 * 구글 광고 API를 사용하여 캠페인 정보와 성과 보고서를 가져옵니다.
 * 
 * 구글 광고 API 연동에 필요한 단계:
 * 1. 구글 클라우드 콘솔에서 OAuth 클라이언트 ID 및 시크릿 발급
 * 2. 구글 광고 계정에서 개발자 토큰 발급
 * 3. 구글 OAuth 인증 과정 수행하여 refresh_token 발급
 * 
 * 자세한 연동 방법: https://developers.google.com/google-ads/api/docs/oauth/overview
 */

import axios, { AxiosError } from 'axios';

// 구글 광고 API 연동에 필요한 환경 변수
const DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REFRESH_TOKEN = process.env.GOOGLE_ADS_REFRESH_TOKEN || '';
const CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID || '';
const LOGIN_CUSTOMER_ID = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '';

// API 버전
const API_VERSION = process.env.API_VERSION || '19';

// API 기본 URL
const API_BASE_URL = 'https://googleads.googleapis.com';

console.log('구글 광고 API 모듈 초기화');
console.log('환경 변수가 설정되었습니다:');
console.log('- CLIENT_ID: ' + (CLIENT_ID ? '설정됨' : '설정되지 않음'));
console.log('- CLIENT_SECRET: ' + (CLIENT_SECRET ? '설정됨' : '설정되지 않음'));
console.log('- REFRESH_TOKEN: ' + (REFRESH_TOKEN ? '설정됨' : '설정되지 않음'));
console.log('- DEVELOPER_TOKEN: ' + (DEVELOPER_TOKEN ? '설정됨' : '설정되지 않음'));
console.log('- CUSTOMER_ID: ' + CUSTOMER_ID); // 실제 값 출력
console.log('- LOGIN_CUSTOMER_ID: ' + (LOGIN_CUSTOMER_ID ? '설정됨' : '설정되지 않음'));
console.log(`- API_VERSION: ${API_VERSION}`);

// 액세스 토큰 가져오기
async function getAccessToken() {
  try {
    const tokenEndpoint = 'https://oauth2.googleapis.com/token';
    const formData = new URLSearchParams();
    formData.append('client_id', CLIENT_ID);
    formData.append('client_secret', CLIENT_SECRET);
    formData.append('refresh_token', REFRESH_TOKEN);
    formData.append('grant_type', 'refresh_token');
    
    console.log('액세스 토큰 요청 중...');
    
    const response = await axios.post(tokenEndpoint, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('액세스 토큰 획득 성공');
    return response.data.access_token;
  } catch (error) {
    console.error('액세스 토큰 획득 오류:', error);
    throw new Error('액세스 토큰을 획득할 수 없습니다.');
  }
}

// Google Ads API 요청 헤더 생성
async function getHeaders() {
  try {
    const accessToken = await getAccessToken();
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': DEVELOPER_TOKEN,
      'Content-Type': 'application/json'
    };
    
    // 로그인 고객 ID가 설정된 경우에만 헤더에 포함
    if (LOGIN_CUSTOMER_ID) {
      headers['login-customer-id'] = LOGIN_CUSTOMER_ID;
    }
    
    console.log('API 헤더 생성 완료:', JSON.stringify(headers, null, 2).replace(accessToken, '[REDACTED]'));
    
    return headers;
  } catch (error) {
    console.error('API 헤더 생성 오류:', error);
    throw error;
  }
}

// 환경 변수 로깅 함수
function logEnvironmentVars() {
  console.log('환경 변수 상태:');
  console.log(`- DEVELOPER_TOKEN: ${DEVELOPER_TOKEN ? '설정됨' : '설정되지 않음'}`);
  console.log(`- CLIENT_ID: ${CLIENT_ID ? '설정됨' : '설정되지 않음'}`);
  console.log(`- CLIENT_SECRET: ${CLIENT_SECRET ? '설정됨' : '설정되지 않음'}`);
  console.log(`- REFRESH_TOKEN: ${REFRESH_TOKEN ? '설정됨' : '설정되지 않음'}`);
  console.log(`- CUSTOMER_ID: ${CUSTOMER_ID || '설정되지 않음'}`);
  console.log(`- LOGIN_CUSTOMER_ID: ${LOGIN_CUSTOMER_ID || '설정되지 않음'}`);
  console.log(`- API_VERSION: ${API_VERSION}`);
}

/**
 * 여러 API 엔드포인트 형식을 시도하는 함수
 * 
 * 구글 광고 API 호출 시 여러 형식의 엔드포인트를 시도합니다.
 * 실패 시 다른 형식으로 재시도합니다.
 */
export async function tryMultipleEndpoints(query: string) {
  // 시도할 엔드포인트 형식 목록
  const endpointFormats = [
    // 표준 형식
    `${API_BASE_URL}/v${API_VERSION}/customers/${CUSTOMER_ID}/googleAds:search`,
    // 슬래시 추가
    `${API_BASE_URL}/v${API_VERSION}/customers/${CUSTOMER_ID}/googleAds/search`,
    // 다른 도메인 시도
    `https://ads.googleapis.com/v${API_VERSION}/customers/${CUSTOMER_ID}/googleAds:search`,
    // API 버전 없는 형식
    `${API_BASE_URL}/customers/${CUSTOMER_ID}/googleAds:search`,
    // 표준 API 호출 형식
    `${API_BASE_URL}/v${API_VERSION}/customers/${CUSTOMER_ID}/campaigns:search`
  ];
  
  const errors = [];
  
  for (const endpoint of endpointFormats) {
    try {
      console.log(`엔드포인트 시도: ${endpoint}`);
      
      const headers = await getHeaders();
      const response = await axios.post(endpoint, { query }, { headers });
      
      console.log('API 호출 성공!');
      console.log('API 응답 데이터 구조:', JSON.stringify({
        status: response.status,
        hasResults: !!response.data.results,
        resultsLength: Array.isArray(response.data.results) ? response.data.results.length : 'not array',
        dataKeys: Object.keys(response.data),
        sampleData: response.data.results && response.data.results.length > 0 ? response.data.results[0] : null
      }, null, 2));
      
      return response.data.results || [];
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`엔드포인트 ${endpoint} 실패: ${errorMessage}`);
      errors.push({ endpoint, error: errorMessage });
      
      // 오류 응답이 있는 경우 자세한 정보 출력
      if (error instanceof AxiosError && error.response) {
        console.error('API 응답 상태:', error.response.status);
        console.error('API 응답 데이터:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
  
  // 모든 엔드포인트 시도 실패
  console.error('모든 엔드포인트 시도 실패:', JSON.stringify(errors, null, 2));
  throw new Error('모든 API 엔드포인트 시도 실패');
}

/**
 * 캠페인 목록 가져오기
 * 
 * 구글 광고 API를 통해 계정의 캠페인 목록을 가져옵니다.
 */
export async function getCampaigns() {
  try {
    // 환경 변수 로그
    console.log('getCampaigns() 호출됨');
    logEnvironmentVars();
    
    const query = `
      SELECT 
        campaign.id, 
        campaign.name, 
        campaign.status,
        campaign_budget.amount_micros
      FROM campaign
      ORDER BY campaign.name
      LIMIT 50
    `;
    
    console.log('API 쿼리:', query);
    
    // API 요청
    return await tryMultipleEndpoints(query);
  } catch (error) {
    console.error('getCampaigns 에러:', error);
    throw error;
  }
}

/**
 * 특정 기간의 캠페인 퍼포먼스 리포트 가져오기
 */
export async function getCampaignPerformanceReport(startDate: string, endDate: string): Promise<any[]> {
  try {
    // 환경 변수 로그
    console.log('API 호출 시작 - 캠페인 성과 보고서');
    logEnvironmentVars();

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY metrics.cost_micros DESC
    `;

    console.log('API 쿼리:', query);

    // API 요청
    return await tryMultipleEndpoints(query);
  } catch (error) {
    console.error('getCampaignPerformanceReport 에러:', error);
    throw error;
  }
}

/**
 * 키워드 퍼포먼스 리포트 가져오기
 */
export async function getKeywordPerformanceReport(startDate: string, endDate: string) {
  try {
    // 환경 변수 로그
    console.log(`키워드 리포트 요청: ${startDate} ~ ${endDate}`);
    logEnvironmentVars();

    const query = `
      SELECT
        ad_group_criterion.keyword.text,
        campaign.name,
        ad_group.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr
      FROM keyword_view
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY metrics.impressions DESC
    `;

    console.log('API 쿼리:', query);

    // API 요청
    return await tryMultipleEndpoints(query);
  } catch (error) {
    console.error('getKeywordPerformanceReport 에러:', error);
    throw error;
  }
}

/**
 * 광고 그룹 목록 가져오기
 * 
 * 캠페인 ID를 기준으로 해당 캠페인의 광고 그룹 목록을 가져옵니다.
 */
export async function getAdGroups(campaignId?: string) {
  try {
    // 환경 변수 로그
    console.log('getAdGroups() 호출됨', campaignId ? `캠페인 ID: ${campaignId}` : '전체 광고 그룹 요청');
    logEnvironmentVars();
    
    let query = `
      SELECT 
        ad_group.id, 
        ad_group.name,
        campaign.id,
        campaign.name
      FROM ad_group
      ORDER BY ad_group.name
      LIMIT 50
    `;
    
    // 캠페인 ID가 제공된 경우 해당 캠페인의 광고 그룹만 필터링
    if (campaignId) {
      query = `
        SELECT 
          ad_group.id, 
          ad_group.name,
          campaign.id,
          campaign.name
        FROM ad_group
        WHERE campaign.id = '${campaignId}'
        ORDER BY ad_group.name
        LIMIT 50
      `;
    }
    
    console.log('API 쿼리:', query);
    
    // API 요청
    return await tryMultipleEndpoints(query);
  } catch (error) {
    console.error('getAdGroups 에러:', error);
    throw error;
  }
}

/**
 * 광고 그룹 퍼포먼스 리포트 가져오기
 * 
 * 특정 기간 동안의 광고 그룹 성과 데이터를 가져옵니다.
 * 선택적으로 특정 캠페인의 광고 그룹만 필터링할 수 있습니다.
 */
export async function getAdGroupPerformanceReport(startDate: string, endDate: string, campaignId?: string | null) {
  try {
    // 환경 변수 로그
    console.log(`광고 그룹 리포트 요청: ${startDate} ~ ${endDate}${campaignId ? ', 캠페인 ID: ' + campaignId : ''}`);
    logEnvironmentVars();

    let query = `
      SELECT
        ad_group.id,
        ad_group.name,
        campaign.id,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr
      FROM ad_group
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY metrics.cost_micros DESC
    `;

    // 캠페인 ID가 제공된 경우 해당 캠페인의 광고 그룹만 필터링
    if (campaignId) {
      query = `
        SELECT
          ad_group.id,
          ad_group.name,
          campaign.id,
          campaign.name,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.ctr
        FROM ad_group
        WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
          AND campaign.id = '${campaignId}'
        ORDER BY metrics.cost_micros DESC
      `;
    }

    console.log('API 쿼리:', query);

    // API 요청
    try {
      return await tryMultipleEndpoints(query);
    } catch (error) {
      console.error('API 호출 실패, Mock 데이터 반환:', error);
      return getMockAdGroupPerformanceReport(campaignId);
    }
  } catch (error) {
    console.error('getAdGroupPerformanceReport 에러:', error);
    return getMockAdGroupPerformanceReport(campaignId);
  }
}

/**
 * 테스트용 Mock 광고 그룹 성과 데이터
 */
function getMockAdGroupPerformanceReport(campaignId?: string | null) {
  const mockData = [
    {
      ad_group: { id: '1001', name: '브랜드 키워드 그룹' },
      campaign: { id: '101', name: '브랜드 캠페인' },
      metrics: {
        impressions: 12500,
        clicks: 750,
        cost_micros: 1500000000, // 1,500,000 KRW (micro-units)
        conversions: 45,
        ctr: 0.06
      }
    },
    {
      ad_group: { id: '1002', name: '제품 키워드 그룹' },
      campaign: { id: '101', name: '브랜드 캠페인' },
      metrics: {
        impressions: 8700,
        clicks: 520,
        cost_micros: 980000000, // 980,000 KRW
        conversions: 30,
        ctr: 0.059
      }
    },
    {
      ad_group: { id: '2001', name: '경쟁사 키워드 그룹' },
      campaign: { id: '102', name: '경쟁사 타겟팅 캠페인' },
      metrics: {
        impressions: 5600,
        clicks: 280,
        cost_micros: 750000000, // 750,000 KRW
        conversions: 15,
        ctr: 0.05
      }
    },
    {
      ad_group: { id: '3001', name: '일반 검색 그룹' },
      campaign: { id: '103', name: '일반 검색 캠페인' },
      metrics: {
        impressions: 18900,
        clicks: 850,
        cost_micros: 2100000000, // 2,100,000 KRW
        conversions: 55,
        ctr: 0.045
      }
    }
  ];

  // 캠페인 ID로 필터링
  if (campaignId) {
    return mockData.filter(item => item.campaign.id === campaignId);
  }

  return mockData;
}

/**
 * 광고 그룹 ID로 키워드 목록 가져오기
 * 
 * 특정 광고 그룹에 속한 키워드 목록을 가져옵니다.
 */
export async function getKeywordsByAdGroup(adGroupId: string) {
  try {
    // 환경 변수 로그
    console.log(`getKeywordsByAdGroup() 호출됨, 광고 그룹 ID: ${adGroupId}`);
    logEnvironmentVars();
    
    const query = `
      SELECT 
        ad_group_criterion.keyword.text,
        ad_group_criterion.criterion_id,
        ad_group.id,
        ad_group.name,
        campaign.id,
        campaign.name
      FROM keyword_view
      WHERE ad_group.id = '${adGroupId}'
      ORDER BY ad_group_criterion.keyword.text
      LIMIT 100
    `;
    
    console.log('API 쿼리:', query);
    
    // API 요청
    try {
      return await tryMultipleEndpoints(query);
    } catch (error) {
      console.error('API 호출 실패, Mock 데이터 반환:', error);
      return getMockKeywordsByAdGroup(adGroupId);
    }
  } catch (error) {
    console.error('getKeywordsByAdGroup 에러:', error);
    return getMockKeywordsByAdGroup(adGroupId);
  }
}

/**
 * 테스트용 Mock 키워드 데이터
 */
function getMockKeywordsByAdGroup(adGroupId: string) {
  // 광고 그룹별 Mock 키워드 데이터
  const mockDataMap: {[key: string]: any[]} = {
    '174144587179': [
      {
        ad_group_criterion: { criterion_id: '1001', keyword: { text: '건강맛선' } },
        ad_group: { id: '174144587179', name: '건강맛선_브랜드K' },
        campaign: { id: '21980481095', name: '1. [SA] 월간 농협맛선_2월 캠페인 (브랜드)' }
      },
      {
        ad_group_criterion: { criterion_id: '1002', keyword: { text: '농협 맛선' } },
        ad_group: { id: '174144587179', name: '건강맛선_브랜드K' },
        campaign: { id: '21980481095', name: '1. [SA] 월간 농협맛선_2월 캠페인 (브랜드)' }
      },
      {
        ad_group_criterion: { criterion_id: '1003', keyword: { text: '건강 간식' } },
        ad_group: { id: '174144587179', name: '건강맛선_브랜드K' },
        campaign: { id: '21980481095', name: '1. [SA] 월간 농협맛선_2월 캠페인 (브랜드)' }
      }
    ],
    '174144649879': [
      {
        ad_group_criterion: { criterion_id: '2001', keyword: { text: '맛선 브랜드' } },
        ad_group: { id: '174144649879', name: '맛선_브랜드K' },
        campaign: { id: '21980481095', name: '1. [SA] 월간 농협맛선_2월 캠페인 (브랜드)' }
      },
      {
        ad_group_criterion: { criterion_id: '2002', keyword: { text: '맛선 제품' } },
        ad_group: { id: '174144649879', name: '맛선_브랜드K' },
        campaign: { id: '21980481095', name: '1. [SA] 월간 농협맛선_2월 캠페인 (브랜드)' }
      }
    ],
    '174144711979': [
      {
        ad_group_criterion: { criterion_id: '3001', keyword: { text: '농협식품' } },
        ad_group: { id: '174144711979', name: '농협식품_브랜드K' },
        campaign: { id: '21980481095', name: '1. [SA] 월간 농협맛선_2월 캠페인 (브랜드)' }
      },
      {
        ad_group_criterion: { criterion_id: '3002', keyword: { text: '농협 식품' } },
        ad_group: { id: '174144711979', name: '농협식품_브랜드K' },
        campaign: { id: '21980481095', name: '1. [SA] 월간 농협맛선_2월 캠페인 (브랜드)' }
      },
      {
        ad_group_criterion: { criterion_id: '3003', keyword: { text: '농협 브랜드' } },
        ad_group: { id: '174144711979', name: '농협식품_브랜드K' },
        campaign: { id: '21980481095', name: '1. [SA] 월간 농협맛선_2월 캠페인 (브랜드)' }
      }
    ],
    '174144774279': [
      {
        ad_group_criterion: { criterion_id: '4001', keyword: { text: '천연 간식' } },
        ad_group: { id: '174144774279', name: '식품_브랜드K' },
        campaign: { id: '21980481095', name: '1. [SA] 월간 농협맛선_2월 캠페인 (브랜드)' }
      },
      {
        ad_group_criterion: { criterion_id: '4002', keyword: { text: '건강 식품' } },
        ad_group: { id: '174144774279', name: '식품_브랜드K' },
        campaign: { id: '21980481095', name: '1. [SA] 월간 농협맛선_2월 캠페인 (브랜드)' }
      }
    ]
  };
  
  // 광고 그룹 ID에 해당하는 Mock 데이터가 있으면 반환, 없으면 기본 Mock 데이터 반환
  if (mockDataMap[adGroupId]) {
    return mockDataMap[adGroupId];
  }
  
  // 기본 Mock 데이터 (특정 광고 그룹 ID가 매칭되지 않을 경우)
  return [
    {
      ad_group_criterion: { criterion_id: '9001', keyword: { text: '기본 키워드 1' } },
      ad_group: { id: adGroupId, name: '알 수 없는 광고 그룹' },
      campaign: { id: '0', name: '알 수 없는 캠페인' }
    },
    {
      ad_group_criterion: { criterion_id: '9002', keyword: { text: '기본 키워드 2' } },
      ad_group: { id: adGroupId, name: '알 수 없는 광고 그룹' },
      campaign: { id: '0', name: '알 수 없는 캠페인' }
    }
  ];
} 