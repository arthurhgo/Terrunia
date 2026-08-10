import { defineConfig, devices } from '@playwright/test'

const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: chromiumExecutable
          ? {
              executablePath: chromiumExecutable,
              args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process', '--no-zygote'],
            }
          : undefined,
      },
    },
  ],
})
