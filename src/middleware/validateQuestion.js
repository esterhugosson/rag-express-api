export const validateQuestion = (req, res, next) => {
  const { question } = req.body ?? {}

  if (typeof question !== 'string') {
    return res.status(400).json({ message: 'Question is required and must be a string.' })
  }

  const clean = question.replace(/[\x00-\x1F\x7F]/g, ' ').trim()

  if (clean.length < 3 || clean.length > 300) {
    return res.status(400).json({ message: 'Question must be between 3 and 300 characters.' })
  }

  req.body.question = clean
  next()
}