<template>
  <div class="music">
    <el-row>
      <el-col :span="6"></el-col>
      <el-col :span="8">
        <el-autocomplete
          :placeholder="defaultKeyWorlds ? defaultKeyWorlds : '请输入歌曲信息'"
          v-model="keywords"
          :fetch-suggestions="getSearchHot"
          clearable
          @keyup.enter="getMusicList"></el-autocomplete>
      </el-col>
      <el-col :span="4">
        <el-button type="primary" @click="getMusicList"> <Search style="width: 1em; height: 1em" />搜索 </el-button>
      </el-col>
      <el-col :span="6"></el-col>
    </el-row>
    <el-table :data="musicData" border :row-style="rowStyle" rowKey="id" max-height="600" highlight-current-row @row-dblclick="listen" getSelectionRows>
      <template #empty>
        <el-empty description="暂无数据"></el-empty>
      </template>
      <el-table-column type="index" width="50"></el-table-column>
      <el-table-column label="音乐标题" prop="name"></el-table-column>
      <el-table-column label="歌手" v-slot="scoped">{{ scoped.row.ar.map(item => item.name).join('、') }}</el-table-column>
      <el-table-column label="专辑" prop="al.name"></el-table-column>
      <el-table-column label="时长" v-slot="scoped">{{ time(scoped.row.dt) }}</el-table-column>
    </el-table>
    <el-pagination
      background
      :total="total"
      v-model:page-size="pageSize"
      v-model:current-page="current"
      :page-sizes="[10, 20, 30, 40, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      @update:current-page="getMusicList"
      @update:page-size="getMusicList">
    </el-pagination>
    <div class="musicPlayer">
      <div class="left">
        <img class="pic" :src="picUrl" />
        <div class="musicInfo">
          <div class="musicName">{{ musicName }}</div>
          <div class="singer">{{ singer }}</div>
        </div>
      </div>
      <div class="control">
        <div class="loop"><i class="iconfont icon-xunhuan"></i></div>
        <div class="prev" @click="prev"><i class="iconfont icon-shangyishou"></i></div>
        <div class="play" v-if="!isPlay" @click="play"><i class="iconfont icon-bofang"></i></div>
        <div class="pause" v-if="isPlay" @click="play"><i class="iconfont icon-zantingtingzhi"></i></div>
        <div class="next" @click="next"><i class="iconfont icon-xiayishou"></i></div>
        <div class="lyric" style="width: 30px; height: 30px; background: url('/img/lyric.png')"></div>
      </div>
      <div class="right">
        <div class="quality">标准</div>
        <div class="voice"><i class="iconfont icon-yinliang"></i></div>
        <div class="voiceControlbg">
          <div class="voiceControl"></div>
          <div class="voiceSize"></div>
        </div>
      </div>
    </div>
    <audio ref="audio" :src="musicUrl"></audio>
  </div>
</template>

<script>
  import { handleMusicTime } from '@u/tools.js'
  export default {
    name: 'Index',
    data() {
      return {
        defaultKeyWorlds: '', //默认搜索关键词
        keywords: '', //搜索关键词
        musicData: [], //音乐列表
        total: 0, //总计
        pageSize: 20, //分页
        current: 1, //当前页
        audio: null, //<audio/>对象
        isPlay: false, //是否正在播放
        musicUrl: '', //播放地址
        picUrl: '/img/default.jpg', //音乐图片地址
        musicName: '快来听歌呀~', //音乐名称
        singer: '网易云~', //歌手名称
        loopType: 1, //歌曲循环方式  1：顺序播放 2：循环播放 3：随机播放
        musicIdList: [], //播放列表
        musicIdIndex: 0 //下标记录播放列表播放位置
      }
    },
    mounted() {
      this.getSearchDefault()
      this.getAudio()
    },
    methods: {
      // 获取audio对象
      getAudio() {
        this.audio = this.$refs.audio
      },
      // 格式化时间
      time(date) {
        return handleMusicTime(date)
      },
      rowStyle({ row, rowIndex }) {
        if (rowIndex % 2 == 0) {
          return {
            backgroundColor: '#d9ecff'
          }
        }
      },
      // 获取搜索列表
      getMusicList() {
        // 搜索是否为空
        if (!this.keywords) {
          this.keywords = this.defaultKeyWorlds
        }
        this.$http.get('/cloudsearch', { keywords: this.keywords, limit: this.pageSize, offset: (this.current - 1) * this.pageSize, type: 1 }).then(res => {
          if (res.code == 200) {
            this.musicData = res.result.songs
            this.total = res.result.songCount
          }
        })
      },
      // 获取默认搜索关键词
      getSearchDefault() {
        this.$http.get('/search/default').then(res => {
          if (res.code == 200) {
            return (this.defaultKeyWorlds = res.data.realkeyword)
          }
          this.$message.error(res.message)
        })
      },
      // 搜索框下拉展示
      getSearchHot(queryString, callback) {
        // 有搜索关键词显示搜索建议
        if (queryString) {
          let hotMusicList = []
          this.$http.get('/search/suggest', { keywords: queryString }).then(res => {
            if (res.code == 200) {
              hotMusicList = res.result.songs.map(item => {
                let singerList = item.artists.map(item => item.name)
                return { value: singerList.join('、') + '-' + item.name }
              })
              callback(hotMusicList)
            }
          })
        } else {
          // 没有搜索关键词展示热搜列表
          // 获取热搜列表
          let hotMusicList = []
          this.$http.get('/search/hot/detail').then(res => {
            if (res.code == 200) {
              hotMusicList = res.data.map(item => (item = { value: item.searchWord }))
              callback(hotMusicList)
            } else {
              this.$message.error('获取热搜列表失败！')
            }
          })
        }
      },
      // 获取音乐直链Url
      getMusicUrl(id, index) {
        // 搜索完后直接点播放
        if (!id) {
          index = 0
          id = this.musicData[index].id
          this.musicIdList = this.musicData.map(item => item.id)
          this.musicIdIndex = index
        }
        // // 判断音乐是否可用
        // this.$http.get('/check/music', { id }).then(res => {
        //   if (res.code == 200) {
        //     if (!res.data.success) {
        //       this.$message.warning(res.data.message + '~\n已自动为您播放下一首!')
        //       // 不可用  播放下一首
        //       return this.next()
        //     }
        //   }
        // })
        // 控制器信息
        let row = this.musicData[index]
        this.picUrl = row.al.picUrl
        this.musicName = row.name
        this.singer = row.ar.map(item => item.name).join('、')
        // 获取歌曲url
        this.$http.get('/song/url', { id }).then(res => {
          if (res.code == 200) {
            this.musicUrl = res.data[0].url
            if (!this.musicUrl) {
              this.$message.warning('亲~暂时还没有歌曲链接呦~')
              return this.next()
            }
            // 监听资源是否加载，加载完成开始播放
            this.audio.addEventListener('canplay', () => {
              this.audio.play()
            })
          } else {
            this.$message.error(res.message)
          }
        })
      },
      // 双击听歌
      listen(row) {
        this.isPlay = true
        // 当前播放列表
        this.musicIdList = this.musicData.map(item => item.id)
        this.musicIdIndex = this.musicData.findIndex(item => item.id == row.id)
        this.getMusicUrl(row.id, this.musicIdIndex)
        // 监听音乐是否播放完
        this.audio.addEventListener('ended', () => {
          let nextPlayId = ''
          // 顺序播放
          if (this.loopType == 1) {
            if (this.musicIdIndex < this.musicIdList.length - 1) {
              // 不是当前列表最后一首
              this.musicIdIndex = this.musicIdIndex + 1
            } else {
              //转到列表第一首
              this.musicIdIndex = 0
            }
          }
          // 循环播放
          if (this.loopType == 2) {
            this.musicIdIndex = this.musicIdIndex
          }
          // 随机播放
          if (this.loopType == 3) {
            this.musicIdIndex = Math.floor(Math.random() * this.pageSize)
          }
          nextPlayId = this.musicIdList[this.musicIdIndex]
          this.getMusicUrl(nextPlayId, this.musicIdIndex)
        })
      },
      // 播放、暂停
      play() {
        if (this.isPlay) {
          this.isPlay = false
          this.audio.pause()
        } else {
          if (!this.musicData.length) return this.$message.warning('当前播放列表为空!')
          this.isPlay = true
          // 搜索后没有双击直接点播放
          if (!this.musicIdList.length) return this.getMusicUrl()
          this.audio.play()
        }
      },
      // 上一首
      prev() {
        if (!this.musicData.length) return this.$message.warning('当前播放列表为空!')
        this.isPlay = true
        // 搜索后没有双击直接点播放
        if (!this.musicIdList.length) return this.getMusicUrl()
        // 如果是第一首 跳到最后一首
        if (this.musicIdIndex == 0) {
          this.musicIdIndex = this.musicIdList.length - 1
        } else {
          this.musicIdIndex--
        }
        this.getMusicUrl(this.musicIdList[this.musicIdIndex], this.musicIdIndex)
      },
      // 下一首
      next() {
        if (!this.musicData.length) return this.$message.warning('当前播放列表为空!')
        // 搜索后没有双击直接点播放
        this.isPlay = true
        if (!this.musicIdList.length) return this.getMusicUrl()
        // 不是当前列表最后一首
        if (this.musicIdIndex < this.musicIdList.length - 1) {
          this.musicIdIndex++
        } else {
          // 跳到第一首
          this.musicIdIndex = 0
        }
        this.getMusicUrl(this.musicIdList[this.musicIdIndex], this.musicIdIndex)
      }
    }
  }
</script>

<style scoped>
  :deep .el-autocomplete {
    width: 100%;
  }
  :deep .el-input__wrapper {
    border-radius: 4px 0 0 4px;
  }
  .el-button {
    border-radius: 0 4px 4px 0;
  }
  .music {
    width: 80%;
    margin: 50px auto 0;
  }
  .el-table {
    margin-top: 30px;
  }
  .el-pagination {
    margin-top: 20px;
  }
  :deep .current-row {
    background-color: #57aaff !important;
    color: #fff;
  }
  :deep .el-table__body tr.current-row > td.el-table__cell {
    background-color: transparent !important;
  }
  /* 音乐播放器 */
  .musicPlayer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 80px;
    padding: 10px 20px;
    margin-top: 20px;
    border-radius: 4px;
    border: 1px solid #d9ecff;
    box-shadow: 1px 1px 1px #d9ecff, 2px 2px 2px #d9ecff, 3px 3px 3px #d9ecff, 4px 4px 4px #d9ecff;
    box-sizing: border-box;
    .left {
      width: 300px;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      .pic {
        width: 50px;
        height: 50px;
        border-radius: 50%;
      }
    }

    /* 音乐信息 */
    .musicInfo {
      margin-left: 20px;
      .musicName {
        color: #666;
        font-weight: bold;
      }
      .singer {
        font-size: 14px;
        color: #aaa;
      }
    }
    /* 控制器 */
    .control {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 250px;
      height: 30px;
      .iconfont {
        font-size: 24px !important;
      }
      .pause {
        transform: scale(1.8);
      }
    }
    .right {
      width: 300px;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      .quality {
        width: 40px;
        height: 20px;
        border: 1px solid #aaa;
        border-radius: 5px;
        text-align: center;
        line-height: 20px;
        margin-right: 20px;
        color: #666;
        cursor: pointer;
        user-select: none;
      }
      .voiceControlbg {
        position: relative;
        width: 80px;
        height: 6px;
        border-radius: 3px;
        background: #eee;
        margin-left: 10px;
        .voiceControl {
          position: absolute;
          left: -5px;
          top: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #409eff;
          cursor: pointer;
          z-index: 99;
        }
        .voiceSize {
          position: absolute;
          height: 6px;
          width: 10px;
          background-color: #409eff;
        }
      }
    }
  }
</style>
