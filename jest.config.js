// jest.config.js

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
     // Jest-কে TypeScript ফাইল রান করার জন্য ts-jest ব্যবহার করতে বলা হচ্ছে।
     preset: 'ts-jest',

     // কোন এনভায়রনমেন্টে টেস্ট রান হবে। Node.js অ্যাপের জন্য 'node' ব্যবহার করা হয়।
     testEnvironment: 'node',

     // Jest কোন ফোল্ডার বা ফাইলগুলোকে টেস্ট হিসেবে ধরবে তা নির্ধারণ করা।
     // সাধারণত __tests__ ফোল্ডারের ভেতরের সব .ts ফাইল অথবা যেকোনো .test.ts বা .spec.ts ফাইলকে খোঁজে।
     testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],

     // মডিউল পাথ ম্যাপিং (যদি tsconfig.json এ paths ব্যবহার করেন)।
     // moduleNameMapper: {
     //   '^@/(.*)$': '<rootDir>/src/$1',
     // },
};
