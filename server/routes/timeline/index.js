import express from 'express'
import isEmpty from 'lodash/isEmpty'

import db from '../../lib/db'

const router = express.Router()

router.get('/', (req, res) => res.send({ success: true }))

export default router