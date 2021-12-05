// index.js
const app = getApp();
Page({
  data: {
    userInfo: {},
    openID: '',
    canGetUserProfile: false
  },
  onLoad: function () {
    // 判断是否可以获得用户profile
    if (wx.getUserProfile) {
      this.setData({
        canGetUserProfile: true
      });
    }
    // 获取用户信息缓存
    const userInfoFromStorage = wx.getStorageSync('userInfo');
    this.setData({
      userInfo: userInfoFromStorage,
      openID: userInfoFromStorage.openID
    });
    // 设置用户信息全局变量
    app.globalData.userInfo = this.data.userInfo;
    app.globalData.openID = this.data.openID;
  },
  // 获取用户信息
  getUserProfile: function () {
    const that = this;
    wx.showLoading({
      title: '登录中...',
    });
    wx.getUserProfile({
      desc: '用于获取用户创建的相册',
      success: res => {
        console.log('获取用户基本信息成功');
        that.setData({
          userInfo: res.userInfo
        });
        wx.hideLoading();
        that.getOpenID();
      },
      fail: res => {
        console.log('获取用户基本信息失败');
      }
    })
  },
  // 当canGetUserProfile为false时的备用方案
  onGotUserInfo: function (e) {
    wx.showLoading({
      title: '登录中...',
    });
    this.setData({
      userInfo: e.detail.userInfo
    });
    wx.hideLoading();
    this.getOpenID();
  },
  // 通过云函数获得用户openID
  getOpenID: function () {
    const that = this;
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        console.log('云函数login调用成功');
        that.setData({
          openID: res.result.openid
        });
        that.data.userInfo.openID = that.data.openID;
        // 缓存用户信息
        wx.setStorageSync('userInfo', that.data.userInfo);
        // 设置用户信息全局变量
        app.globalData.userInfo = this.data.userInfo;
        app.globalData.openID = this.data.openID;
      },
      fail: res => {
        console.log('云函数login调用失败');
      }
    });
  },
  // 跳转至创建相册页面
  toCreatePage: function () {
    wx.navigateTo({
      url: '/pages/create/create'
    });
  }
})