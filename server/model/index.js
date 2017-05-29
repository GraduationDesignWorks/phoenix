import mongoose from 'mongoose'
const Schema = mongoose.Schema

const userSchema = new Schema({
  account: String,
  name: String,
  password: String,
  motto: String,
  avatar: String,
})

const tokenSchema = new Schema({
  account: String,
  token: String,
})

const followSchema = new Schema({
  follower: String,
  following: String,
})

const timelineSchema = new Schema({
  account: String,
  content: String,
  publishDate: Number,
  images: Array,
})

// 用户点赞的表
const likeSchema = new Schema({
  authorAccount: String,
  account: String,
  avatar: String,
  name: String,
  timelineID: String,
  publishDate: Number,
})

// 评论表
const commentSchema = new Schema({
  authorAccount: String,
  account: String,
  name: String,
  timelineID: String,
  content: String,
  publishDate: Number,
})

export default {
  user: mongoose.model('user', userSchema),
  token: mongoose.model('token', tokenSchema),
  follow: mongoose.model('follow', followSchema),
  timeline: mongoose.model('timeline', timelineSchema),
  like: mongoose.model('like', likeSchema),
  comment: mongoose.model('comment', commentSchema),
}