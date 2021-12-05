// app.js
App({
  onLaunch() {
    wx.cloud.init({
      env: 'album-share-cloud-3ed9jyde993e9c',
      traceUser: true
    })
  },
  globalData: {
    userInfo: null,
    openID: ''
  }
});
