<template>
  <div class="music">
    <el-row>
      <el-col :span="6"></el-col>
      <el-col :span="8">
        <el-autocomplete :placeholder="defaultKeyWorlds ? defaultKeyWorlds : '请输入歌曲信息'" v-model="keywords" :fetch-suggestions="getSearchHot" clearable @keyup.enter="getMusicList">
          <template #default="{ item }">
            <div class="hot">
              <div class="No" :class="item.index == 0 ? 'No1' : item.index == 1 ? 'No2' : item.index == 2 ? 'No3' : ''">{{ item.index + 1 }}</div>
              <div>
                <div class="name">
                  {{ item.value }}<span>{{ item.score }}</span>
                </div>
                <div class="content" v-if="item.content">{{ item.content }}</div>
              </div>
            </div>
          </template>
        </el-autocomplete>
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
    <div>
      <div class="musicPlayer">
        <div class="left">
          <img class="pic" :src="picUrl" :class="{ rotate: isRotate }" />
          <div class="musicInfo">
            <div class="musicName">{{ musicName }}</div>
            <div class="singer">{{ singer }}</div>
          </div>
        </div>
        <div class="control">
          <!-- 歌曲循环方式 -->
          <div class="loop" style="background: url('/img/shunxu.png')" v-show="loopType == 1" @click.stop="switchLoopType"></div>
          <div class="loop" v-show="loopType == 2" @click.stop="switchLoopType"><i class="iconfont icon-xunhuan"></i></div>
          <div class="loop" v-show="loopType == 3" @click.stop="switchLoopType"><i class="iconfont icon-suiji"></i></div>
          <div class="prev" @click="prev"><i class="iconfont icon-shangyishou"></i></div>
          <!-- 播放暂停 -->
          <div class="play" v-show="!isPlay" @click="play"><i class="iconfont icon-bofang"></i></div>
          <div class="pause" v-show="isPlay" @click="play"><i class="iconfont icon-zantingtingzhi"></i></div>
          <div class="next" @click="next"><i class="iconfont icon-xiayishou"></i></div>
          <!-- 歌词 -->
          <div class="lyric" style="width: 30px; height: 30px; background: url('/img/lyric.png')" @click="changeIslyrc"></div>
        </div>
        <div class="right">
          <!-- 音质 -->
          <div class="quality" @click="isLevel = !isLevel">
            {{ levelText }}
            <div class="qualityOptions" v-show="isLevel" @click="switchQuality($event)">标准</div>
            <div class="qualityOptions" v-show="isLevel" @click="switchQuality($event)">较高</div>
            <div class="qualityOptions" v-show="isLevel" @click="switchQuality($event)">极高</div>
            <div class="qualityOptions" v-show="isLevel" @click="switchQuality($event)">无损</div>
          </div>
          <!-- 音量 -->
          <div class="voice" v-if="!isMute" @click="mute"><i class="iconfont icon-yinliang"></i></div>
          <div class="voice" v-else @click="mute" style="width: 16px; height: 16px; background: url('/img/jingyin.png')"></div>
          <div ref="voiceControlbg" class="voiceControlbg" @click="voiceControlClick($event)">
            <div ref="voiceControl" :style="{ left: voiceControlLeft }" class="voiceControl" @mousedown.stop="voiceControlMousedown($event)"></div>
            <div class="voiceSize" :style="{ width: voiceSizeWidth }"></div>
          </div>
        </div>
      </div>
      <!-- 进度条 -->
      <div ref="progressControlbg" class="progressbg" @click="progress($event.clientX)">
        <div ref="progressControl" :style="{ left: progressControlLeft }" class="progressControl" @mousedown.stop="progressControlMousedown($event)"></div>
        <div class="progress" :style="{ width: progressWidth }"></div>
      </div>
    </div>
    <audio ref="audio" :src="musicUrl"></audio>
    <!-- 歌词 -->
    <div class="lyrc" v-if="isLyrc">
      <!-- <div class="items" v-for="(items, index) in parsedLyrics" :key="index"> -->
      <span class="text" v-for="(item, index) in parsedLyrics[this.currentIndex]?.content" :key="index" :class="{ active: index <= currentLyricIndex }">{{ item.content }}</span>
      <!-- </div> -->
    </div>
  </div>
</template>

<script>
  import { handleMusicTime, parseYrc } from '@u/tools.js'
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
        isRotate: false, // 图片是否旋转
        picUrl: '/img/default.jpg', //音乐图片地址
        musicName: '快来听歌呀~', //音乐名称
        singer: '网易云~', //歌手名称
        loopType: 1, //歌曲循环方式  1：顺序播放 2：循环播放 3：随机播放
        musicIdList: [], //播放列表
        musicIdIndex: 0, //下标记录播放列表播放位置
        level: 'standard', //standard => 标准 higher => 较高 exhigh=>极高 lossless=>无损
        isLevel: false, //音质切换
        levelText: '标准', //当前音质
        parsedLyrics: [], //歌词
        currentIndex: 0, //当前歌词下标
        isLyrc: false, //是否展示歌词
        voiceControlLeft: 35 + 'px', //音量小圆点位置
        voiceSizeWidth: 50 + '%', //音量条长度
        voiceControlflag: false, //音量条按下标志
        isMute: false, //是否静音
        progressControlLeft: -5 + 'px',
        progressWidth: 0,
        progressControlflag: false
      }
    },
    mounted() {
      this.getSearchDefault()
      this.getAudio()
      this.audio.volume = 0.5
      document.body.addEventListener('mousemove', e => {
        if (this.voiceControlflag) {
          this.voiceSize(e.clientX)
        }
        if (this.progressControlflag) {
          this.progress(e.clientX)
        }
      })
      document.body.addEventListener('mouseup', () => {
        this.voiceControlflag = false
        this.progressControlflag = false
      })
      this.audio.addEventListener('timeupdate', () => {
        let persent = (this.audio.currentTime / this.audio.duration) * 100
        this.progressControlLeft = persent + '%'
        this.progressWidth = persent + '%'
      })
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
              hotMusicList = res.result.songs.map((item, index) => {
                let singerList = item.artists.map(item => item.name)
                return { index: index, value: singerList.join('、') + '-' + item.name }
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
              hotMusicList = res.data.map((item, index) => (item = { index: index, value: item.searchWord, score: item.score, content: item.content }))
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
        this.$http.get('/song/url/v1', { id, level: this.level }).then(res => {
          if (res.code == 200) {
            this.musicUrl = res.data[0].url
            if (!this.musicUrl) {
              this.$message.warning('亲~暂时还没有歌曲链接呦~')
              return this.next()
            }
            // 监听资源是否加载，加载完成开始播放
            this.audio.addEventListener('canplay', () => {
              this.audio.play()
              this.isRotate = true
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
        this.getLyric()
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
          this.getLyric()
        })
      },
      // 播放、暂停
      play() {
        if (this.isPlay) {
          this.isPlay = false
          this.isRotate = false
          this.audio.pause()
        } else {
          if (!this.musicData.length) return this.$message.warning('当前播放列表为空!')
          this.isPlay = true
          // 搜索后没有双击直接点播放
          if (!this.musicIdList.length) return this.getMusicUrl()
          this.audio.play()
          this.isRotate = true
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
        this.getLyric()
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
        this.getLyric()
      },
      // 切换播放方式
      switchLoopType() {
        if (this.loopType == 1) {
          this.$nextTick(() => {
            this.loopType = 2
          })
        }
        if (this.loopType == 2) {
          this.$nextTick(() => {
            this.loopType = 3
          })
        }
        if (this.loopType == 3) {
          this.$nextTick(() => {
            this.loopType = 1
          })
        }
      },
      // 切换音质
      switchQuality(e) {
        if (e.target.innerText == '标准') {
          this.level = 'standard'
          this.levelText = '标准'
        }
        if (e.target.innerText == '较高') {
          this.level = 'higher'
          this.levelText = '较高'
        }
        if (e.target.innerText == '极高') {
          this.level = 'exhigh'
          this.levelText = '极高'
        }
        if (e.target.innerText == '无损') {
          this.level = 'lossless'
          this.levelText = '无损'
        }
        // 有音乐在播放  this.musicIdIndex + 1 避免index为 0
        if (this.musicIdList.length && this.musicIdIndex + 1) {
          this.getMusicUrl(this.musicIdList[this.musicIdIndex], this.musicIdIndex)
        }
      },
      // 歌词点击
      changeIslyrc() {
        this.isLyrc = !this.isLyrc
        this.getLyric()
      },
      // 获取歌词
      getLyric() {
        if (this.isLyrc) {
          if (!this.musicData.length) return this.$message.warning('当前播放列表为空!')
          // 有音乐在播放  this.musicIdIndex + 1 避免index为 0
          if (this.musicIdList.length && this.musicIdIndex + 1) {
            this.$http.get('/lyric/new', { id: this.musicIdList[this.musicIdIndex] }).then(res => {
              if (!res.yrc?.lyric) {
                this.isLyrc = false
                return this.$message.warning('暂无歌词!')
              }
              const lyrics = res.yrc.lyric
              // 处理歌词
              this.audio.addEventListener('timeupdate', () => {
                this.parsedLyrics = parseYrc(lyrics)
                this.currentIndex = this.findIndex()
              })
            })
          } else {
            this.$message.warning('暂无歌曲播放!')
          }
        } else {
          this.audio.removeEventListener('timeupdate', () => {
            this.currentIndex = this.findIndex()
          })
        }
      },
      // 当前播放的下标
      findIndex() {
        let currentTime = this.audio.currentTime
        for (let i = 0; i < this.parsedLyrics.length; i++) {
          if (currentTime < this.parsedLyrics[i].time) {
            return i - 1 < 0 ? 0 : i - 1
          }
        }
        return this.parsedLyrics.length - 1
      },
      //点击音量条
      voiceControlClick(e) {
        this.voiceSize(e.clientX)
      },
      //拖动音量条
      voiceControlMousedown(e) {
        this.voiceControlflag = true
        this.voiceSize(e.clientX)
      },
      // 更新音量的位置、音量调节
      voiceSize(clientX) {
        let cilentObj = this.$refs.voiceControlbg.getBoundingClientRect()
        let voiceSize = clientX - cilentObj.left
        let voiceControlbgWidth = cilentObj.right - cilentObj.left
        if (voiceSize / voiceControlbgWidth > 1) {
          this.audio.volume = 1
          this.voiceControlLeft = voiceControlbgWidth + 'px'
          this.voiceSizeWidth = 100 + '%'
        } else if (voiceSize / voiceControlbgWidth < 0) {
          this.audio.volume = 0
          this.voiceControlLeft = +'px'
          this.voiceSizeWidth = 0 + '%'
        } else {
          this.audio.volume = voiceSize / voiceControlbgWidth
          this.voiceControlLeft = voiceSize + 'px'
          this.voiceSizeWidth = this.audio.volume * 100 + '%'
        }
      },
      // 一键静音
      mute() {
        this.isMute = !this.isMute
        this.audio.muted = !this.audio.muted
      },
      // 拖拽音乐进度条
      progressControlMousedown(e) {
        this.progressControlflag = true
        this.progress(e.clientX)
      },
      //播放进度调节
      progress(clientX) {
        if (!this.audio.duration) {
          this.progressControlflag = false
          return this.$message.warning('暂无歌曲播放!')
        }
        let cilentObj = this.$refs.progressControlbg.getBoundingClientRect()
        let progress = clientX - cilentObj.left
        let progressControlbgWidth = cilentObj.right - cilentObj.left
        let total = this.audio.duration //音乐总时长
        if (progress / progressControlbgWidth > 1) {
          this.audio.currentTime = total
          this.progressControlLeft = progressControlbgWidth - 5 + 'px'
          this.progressWidth = 100 + '%'
        } else if (progress / progressControlbgWidth < 0) {
          this.audio.currentTime = 0
          this.progressControlLeft = 0
          this.progressWidth = 0
        } else {
          this.audio.currentTime = (progress / progressControlbgWidth) * total
          this.progressControlLeft = progress + 'px'
          this.progressWidth = (progress / progressControlbgWidth) * 100 + '%'
        }
      }
    },
    computed: {
      currentLyricIndex() {
        let currentLyric = this.parsedLyrics[this.currentIndex].content
        // 赋值-1防止开始进去就高亮第一个词
        let currentLyricIndex
        for (let i = 0; i < currentLyric.length; i++) {
          if (currentLyric[i].time < this.audio.currentTime && this.audio.currentTime < currentLyric[i].time + currentLyric[i].duration) {
            currentLyricIndex = i
            break
          }
          // 第一句还没开始
          if (this.audio.currentTime < currentLyric[0].time) {
            currentLyricIndex = -1
          }
          // 一句放完了
          if (this.audio.currentTime > currentLyric[currentLyric.length - 1].time) {
            currentLyricIndex = currentLyric.length - 1
          }
        }
        return currentLyricIndex
      }
    }
  }
</script>

<style lang="less" scoped>
  :deep .el-autocomplete {
    width: 100%;
  }
  .hot {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-bottom: 5px;
    .No {
      width: 30px;
      height: 30px;
      margin-right: 20px;
      color: #ccc;
      text-align: center;
      line-height: 37px;
      font-weight: bold;
    }
    .No1 {
      color: #f1c40f;
      background: url(/img/排名1.png) no-repeat center;
    }
    .No2 {
      color: #cdcdcd;
      background: url(/img/排名2.png) no-repeat center;
    }
    .No3 {
      color: #e67e22;
      background: url(/img/排名3.png) no-repeat center;
    }
    .name {
      height: 28px;
      color: #333;
      font-size: 16px;
      font-weight: bold;
      span {
        color: #cdcdcd;
        font-size: 14px;
        font-weight: normal;
        margin-left: 10px;
      }
    }
    .content {
      height: 24px;
      color: #aaa;
      line-height: 24px;
    }
  }
  :deep .el-input__wrapper {
    border-radius: 4px 0 0 4px;
  }
  .el-button {
    border-radius: 0 4px 4px 0;
  }
  .music {
    width: 80%;
    height: 100%;
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
      .rotate {
        animation: picRotate 3s infinite linear;
      }
      @keyframes picRotate {
        0% {
          transform: rotate(0deg);
        }
        50% {
          transform: rotate(180deg);
        }
        100% {
          transform: rotate(360deg);
        }
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
        margin-top: 5px;
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
      .loop {
        width: 24px;
        height: 24px;
      }
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
        position: relative;
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
      .qualityOptions {
        position: absolute;
        width: 40px;
        height: 20px;
        border: 1px solid #aaa;
        border-radius: 5px;
        text-align: center;
        line-height: 20px;
        background-color: #fff;
        color: #666;
        cursor: pointer;
        user-select: none;
      }
      .qualityOptions:hover {
        background-color: #ccc;
        color: #fff;
      }
      .qualityOptions:nth-child(1) {
        top: -120px;
        left: 0;
        z-index: 99;
      }
      .qualityOptions:nth-child(2) {
        top: -90px;
        left: 0;
      }
      .qualityOptions:nth-child(3) {
        top: -60px;
        left: 0;
      }
      .qualityOptions:nth-child(4) {
        top: -30px;
        left: 0;
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
          background-color: #409eff;
        }
      }
    }
  }
  /* 进度条 */
  .progressbg {
    position: relative;
    top: -15px;
    width: 70%;
    height: 6px;
    border-radius: 3px;
    background: #eee;
    margin: auto;
    .progressControl {
      position: absolute;
      top: -2px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #409eff;
      cursor: pointer;
      z-index: 99;
    }
    .progress {
      position: absolute;
      height: 6px;
      background-color: #409eff;
    }
  }
  /* 歌词 */
  .lyrc {
    width: 100%;
    height: 50px;
    /* overflow: hidden; */
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    .text {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      line-height: 50px;
    }
    .active {
      color: #409eff;
      transition: 0.5s;
    }
  }
</style>
