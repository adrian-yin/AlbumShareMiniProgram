// index.js
const app = getApp();
Page({
  data: {
    userInfo: {},
    openID: '',
    canGetUserProfile: false,
    albums: []
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
    if (this.data.openID !== '') {
      // 设置用户信息全局变量
      app.globalData.userInfo = this.data.userInfo;
      app.globalData.openID = this.data.openID;
      // 获取相册
      this.getAlbums();
    }
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
        that.getOpenID();
      },
      fail: res => {
        console.log('获取用户基本信息失败');
      }
    })
  },
  // 当canGetUserProfile为false时的备用方案
  onGotUserInfo: function (e) {
    const that = this;
    wx.showLoading({
      title: '登录中...',
    });
    that.setData({
      userInfo: e.detail.userInfo
    });
    that.getOpenID();
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
        // 完成登录后执行的操作
        // 缓存用户信息
        wx.setStorageSync('userInfo', that.data.userInfo);
        // 设置用户信息全局变量
        app.globalData.userInfo = this.data.userInfo;
        app.globalData.openID = this.data.openID;
        // 隐藏加载窗口
        wx.hideLoading();
        // 获取相册
        that.getAlbums();
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
  },
  // 获取当前用户创建的相册
  getAlbums: function () {
    const that = this;
    const db = wx.cloud.database();
    db.collection('albums').where({
      authorID: that.data.openID
    }).get({
      success: res => {
        that.setData({
          albums: res.data
        });
      }
    });
  },
  // 跳转到相册展示页面
  toShowPage: function (e) {
    wx.navigateTo({
      url: '/pages/show/show?id=' + e.mark.album._id
    });
  },
  // 删除相册
  deleteAlbum: function (e) {
    const that = this;
    wx.showModal({
      title: '删除相册',
      content: '确定删除这个相册吗？',
      confirmColor: '#000000',
      success: res => {
        if (res.confirm) {
          console.log('删除相册');
          const album = e.mark.album;
          // 更新当前页面数据
          const newAlbums = that.data.albums;
          newAlbums.splice(e.mark.albumIndex, 1);
          that.setData({
            albums: newAlbums
          });
          wx.showToast({
            title: '删除成功',
          });
          // 从云空间删除该相册所有照片
          wx.cloud.deleteFile({
            fileList: album.pictureUrls,
            success: res1 => {
              console.log('成功删除云空间照片');
            }
          });
          // 删除数据库记录
          const db = wx.cloud.database();
          db.collection('albums').doc(album._id).remove({
            success: res1 => {
              console.log('成功删除数据库记录');
            }
          });
        }
      }
    })
  }
})