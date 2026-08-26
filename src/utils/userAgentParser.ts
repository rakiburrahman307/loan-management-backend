export interface IParsedUserAgent {
     browser: string;
     os: string;
     device: string;
}

export const parseUserAgent = (userAgentString: string): IParsedUserAgent => {
     let browser = 'Unknown Browser';
     let os = 'Unknown OS';
     let device = 'Desktop';

     if (!userAgentString) {
          return { browser, os, device };
     }

     const ua = userAgentString.toLowerCase();

     // Detect Browser
     if (ua.includes('firefox')) browser = 'Firefox';
     else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
     else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
     else if (ua.includes('edge')) browser = 'Edge';
     else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

     // Detect OS
     if (ua.includes('windows')) os = 'Windows';
     else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
     else if (ua.includes('linux')) os = 'Linux';
     else if (ua.includes('android')) os = 'Android';
     else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

     // Detect Device Type
     if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) {
          device = 'Mobile';
     } else if (ua.includes('tablet') || ua.includes('ipad')) {
          device = 'Tablet';
     }

     return { browser, os, device };
};
