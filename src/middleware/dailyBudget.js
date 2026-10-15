import mongoose from 'mongoose'

const usageSchema = new mongoose.Schema({
  day: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  // TTL index: old days clean themselves up after 7 days
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 7 },
})
const DailyUsage = mongoose.model('DailyUsage', usageSchema)

const DAILY_LIMIT = Number(process.env.RAG_DAILY_LIMIT ?? 100)

export const dailyBudget = async (req, res, next) => {
  try {
    const day = new Date().toISOString().slice(0, 10) // UTC date
    const usage = await DailyUsage.findOneAndUpdate(
      { day },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    )

    res.set('X-Demo-Remaining', String(Math.max(0, DAILY_LIMIT - usage.count)))

    if (usage.count > DAILY_LIMIT) {
      return res.status(429).json({
        message: 'The demo has reached its daily question limit to keep costs down. Please come back tomorrow, or contact me for a walkthrough!',
      })
    }
    next()
  } catch (err) {
    next(err)
  }
}