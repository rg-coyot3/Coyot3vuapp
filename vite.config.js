import { fileURLToPath, URL } from 'node:url'

import { defineConfig , loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() , '');

  return {
    define : {
      __APP_ENV__ : JSON.stringify(env.APP_ENV),
    },
    plugins: [
      vue(),
      vueDevTools(),

    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },

    },
    server : {
      proxy : {
        '/coyot3' : 'http://localhost:8080',
        '/components' : 'http://localhost:8080',
        '/coyot3/ws' : 'ws://localhost:8080'
      },
      cors : {
        origin:'*'
      },
      headers : [{'this-is-one-header' : 'with-content'}]
        
      
    }
  }
});

