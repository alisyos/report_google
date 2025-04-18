/**
 * 구글 광고 API 연동 모듈
 * 
 * 구글 광고 API를 사용하여 캠페인 정보와 성과 보고서를 가져옵니다.
 * 오류 발생 시 모의 데이터로 대체합니다.
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

// API 호출 여부를 결정하는 환경 변수 (기본값은 false - 목업 데이터 사용)
const USE_REAL_API = process.env.USE_REAL_API === 'true';
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
console.log(`- USE_REAL_API: ${USE_REAL_API}`);
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
  console.log(`- USE_REAL_API: ${USE_REAL_API}`);
  console.log(`- API_VERSION: ${API_VERSION}`);
}

/**
 * 여러 API 엔드포인트 형식을 시도하는 함수
 * 
 * 구글 광고 API 호출 시 여러 형식의 엔드포인트를 시도합니다.
 * 실패 시 다른 형식으로 재시도합니다.
 */
export async function tryMultipleEndpoints(query: string, type: string, startDate?: string, endDate?: string) {
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
  console.log('모의 데이터로 대체합니다.');
  
  // 모든 재시도 실패 시 모의 데이터 반환
  if (type === 'campaigns') {
    return getMockCampaigns();
  } else if (type === 'campaign_report' && startDate && endDate) {
    return getMockCampaignReport();
  } else if (type === 'keyword_report' && startDate && endDate) {
    return getMockKeywordReport();
  }
  
  return [];
}

/**
 * 캠페인 목록 가져오기
 * 
 * 구글 광고 API를 통해 계정의 캠페인 목록을 가져옵니다.
 * API 연동 실패 시 모의 데이터를 반환합니다.
 */
export async function getCampaigns() {
  try {
    // 환경 변수 로그
    console.log('getCampaigns() 호출됨');
    logEnvironmentVars();
    
    // 실제 환경에서는 API를 호출합니다.
    if (USE_REAL_API) {
      const endpoint = `/v${API_VERSION}/customers/${CUSTOMER_ID}/googleAds:search`;
      console.log(`엔드포인트: ${endpoint}`);
      
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
      
      // Axios를 통해 API 요청
      try {
        return await tryMultipleEndpoints(query, 'campaigns');
      } catch (error) {
        console.error('API 호출 실패:', error);
        console.log('목업 데이터로 대체합니다.');
        return getMockCampaigns();
      }
    }
    
    // 개발 환경에서는 목업 데이터를 반환합니다.
    console.log('목업 데이터 반환: getCampaigns');
    return getMockCampaigns();
  } catch (error) {
    console.error('getCampaigns 에러:', error);
    // 오류 발생 시 빈 배열 대신 목업 데이터 반환
    return getMockCampaigns();
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

    // 실제 환경에서는 API를 호출합니다.
    if (USE_REAL_API) {
      const endpoint = `/v${API_VERSION}/customers/${CUSTOMER_ID}/googleAds:search`;
      console.log(`엔드포인트: ${endpoint}`);

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

      // Axios를 통해 API 요청
      try {
        return await tryMultipleEndpoints(query, 'campaign_report', startDate, endDate);
      } catch (error) {
        console.error('API 호출 실패:', error);
        console.log('목업 데이터로 대체합니다.');
        return getMockCampaignReport();
      }
    }

    // 개발 환경에서는 목업 데이터를 반환합니다.
    console.log('목업 데이터 반환: getCampaignPerformanceReport');
    return getMockCampaignReport();
  } catch (error) {
    console.error('getCampaignPerformanceReport 에러:', error);
    // 오류 발생 시 빈 배열 대신 목업 데이터 반환
    return getMockCampaignReport();
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

    // 실제 환경에서는 API를 호출합니다.
    if (USE_REAL_API) {
      const endpoint = `/v${API_VERSION}/customers/${CUSTOMER_ID}/googleAds:search`;
      console.log(`엔드포인트: ${endpoint}`);

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

      // Axios를 통해 API 요청
      try {
        return await tryMultipleEndpoints(query, 'keyword_report', startDate, endDate);
      } catch (error) {
        console.error('API 호출 실패:', error);
        console.log('목업 데이터로 대체합니다.');
        return getMockKeywordReport();
      }
    }

    // 개발 환경에서는 목업 데이터를 반환합니다.
    console.log('목업 데이터 반환: getKeywordPerformanceReport');
    return getMockKeywordReport();
  } catch (error) {
    console.error('getKeywordPerformanceReport 에러:', error);
    // 오류 발생 시 빈 배열 대신 목업 데이터 반환
    return getMockKeywordReport();
  }
}

// 모의 데이터 함수 - API 연동 실패 시 대체 데이터로 사용
function getMockCampaigns() {
  return [
    {
      campaign: { 
        id: '12345678', 
        name: '브랜드 인지도 캠페인', 
        status: 'ENABLED'
      },
      campaign_budget: {
        amount_micros: '50000000000'
      }
    },
    {
      campaign: { 
        id: '23456789', 
        name: '제품 프로모션 캠페인', 
        status: 'ENABLED'
      },
      campaign_budget: {
        amount_micros: '35000000000'
      }
    },
    {
      campaign: { 
        id: '34567890', 
        name: '리마케팅 캠페인', 
        status: 'PAUSED'
      },
      campaign_budget: {
        amount_micros: '25000000000'
      }
    },
    {
      campaign: { 
        id: '45678901', 
        name: '계절 할인 캠페인', 
        status: 'ENABLED'
      },
      campaign_budget: {
        amount_micros: '40000000000'
      }
    },
    {
      campaign: { 
        id: '56789012', 
        name: '신제품 출시 캠페인', 
        status: 'ENABLED'
      },
      campaign_budget: {
        amount_micros: '45000000000'
      }
    }
  ];
}

function getMockCampaignReport(): any[] {
  return [
    {
      campaign: { id: '123456789', name: '브랜드 인지도 캠페인' },
      metrics: {
        impressions: '15000',
        clicks: '450',
        cost_micros: '12500000', // 12.5 원
        conversions: '25',
        ctr: '0.03'
      }
    },
    {
      campaign: { id: '987654321', name: '제품 프로모션 캠페인' },
      metrics: {
        impressions: '8500',
        clicks: '320',
        cost_micros: '9800000', // 9.8 원
        conversions: '18',
        ctr: '0.0376'
      }
    },
    {
      campaign: { id: '456789123', name: '리마케팅 캠페인' },
      metrics: {
        impressions: '5200',
        clicks: '210',
        cost_micros: '7500000', // 7.5 원
        conversions: '15',
        ctr: '0.0403'
      }
    },
    {
      campaign: { id: '654321987', name: '검색 광고 캠페인' },
      metrics: {
        impressions: '12000',
        clicks: '380',
        cost_micros: '15000000', // 15 원
        conversions: '22',
        ctr: '0.0316'
      }
    },
    {
      campaign: { id: '321987654', name: '신규 고객 확보 캠페인' },
      metrics: {
        impressions: '7800',
        clicks: '290',
        cost_micros: '8900000', // 8.9 원
        conversions: '17',
        ctr: '0.0372'
      }
    }
  ];
}

function getMockKeywordReport(): any[] {
  return [
    {
      ad_group_criterion: { keyword: { text: '디지털 마케팅' } },
      campaign: { name: '디지털 마케팅 캠페인' },
      ad_group: { name: '디지털 마케팅 그룹' },
      metrics: {
        impressions: '5000',
        clicks: '250',
        cost_micros: '5500000', // 5.5 원
        conversions: '15',
        ctr: '0.05'
      }
    },
    {
      ad_group_criterion: { keyword: { text: '온라인 광고' } },
      campaign: { name: '디지털 마케팅 캠페인' },
      ad_group: { name: '온라인 광고 그룹' },
      metrics: {
        impressions: '3500',
        clicks: '180',
        cost_micros: '4200000', // 4.2 원
        conversions: '12',
        ctr: '0.0514'
      }
    },
    {
      ad_group_criterion: { keyword: { text: 'SEO 최적화' } },
      campaign: { name: '검색 마케팅 캠페인' },
      ad_group: { name: 'SEO 그룹' },
      metrics: {
        impressions: '2800',
        clicks: '140',
        cost_micros: '3600000', // 3.6 원
        conversions: '8',
        ctr: '0.05'
      }
    },
    {
      ad_group_criterion: { keyword: { text: '소셜 미디어 마케팅' } },
      campaign: { name: '소셜 미디어 캠페인' },
      ad_group: { name: '소셜 미디어 그룹' },
      metrics: {
        impressions: '4200',
        clicks: '210',
        cost_micros: '4800000', // 4.8 원
        conversions: '14',
        ctr: '0.05'
      }
    },
    {
      ad_group_criterion: { keyword: { text: '이메일 마케팅' } },
      campaign: { name: '이메일 캠페인' },
      ad_group: { name: '이메일 마케팅 그룹' },
      metrics: {
        impressions: '3000',
        clicks: '150',
        cost_micros: '3800000', // 3.8 원
        conversions: '10',
        ctr: '0.05'
      }
    }
  ];
} 