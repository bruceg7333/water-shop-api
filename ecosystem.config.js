require('dotenv').config(); // Load .env file

module.exports = {
  apps: [{
    name: 'backend-api',
    script: 'src/app.js',
    // env: {
    //   NODE_ENV: 'development',
    //   ...require('dotenv').config().parsed
    // },
    // env_production: {
    //   NODE_ENV: 'production',
    //   ...require('dotenv').config().parsed
    // }
  }]
}