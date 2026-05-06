import { Router, Request, Response } from 'express';
import pool from '../db';
import { requirePatient } from '../middleware/auth';

const router = Router();

// POST /tools — Create a new tool instance
router.post('/', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const { tool_type } = req.body;

  const validTypes = ['twenty_reasons', 'black_pictures', 'daily_planner', 'safety_map', 'personal_triangle', 'program_principles', 'personality_problems', 'decision_matrix'];
  if (!validTypes.includes(tool_type)) {
    res.status(400).json({ error: 'نوع الأداة غير صالح' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO tools (patient_id, tool_type) VALUES ($1, $2) RETURNING *`,
      [patientId, tool_type]
    );
    res.status(201).json({ tool: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /tools — List all tools for patient
router.get('/', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;

  try {
    const result = await pool.query(
      `SELECT * FROM tools WHERE patient_id = $1 ORDER BY created_at DESC`,
      [patientId]
    );
    res.json({ tools: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /tools/:tool_id — Get full tool with all content
router.get('/:tool_id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);

  try {
    // Get tool metadata
    const toolResult = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolResult.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const tool = toolResult.rows[0];
    let content: any = {};

    // Fetch tool-specific content
    if (tool.tool_type === 'twenty_reasons') {
      const reasons = await pool.query(
        `SELECT * FROM twenty_reasons WHERE tool_id = $1 ORDER BY reason_number`,
        [toolId]
      );
      content.reasons = reasons.rows;
    } else if (tool.tool_type === 'black_pictures') {
      const stories = await pool.query(
        `SELECT * FROM black_pictures WHERE tool_id = $1 ORDER BY story_number`,
        [toolId]
      );
      content.stories = stories.rows;
    } else if (tool.tool_type === 'daily_planner') {
      const activities = await pool.query(
        `SELECT * FROM daily_planner WHERE tool_id = $1 ORDER BY plan_date, hour`,
        [toolId]
      );
      content.activities = activities.rows;
    } else if (tool.tool_type === 'decision_matrix') {
      const items = await pool.query(
        `SELECT * FROM decision_matrix_items WHERE tool_id = $1 ORDER BY category, position_order`,
        [toolId]
      );
      content.items = items.rows;
    }

    res.json({ tool: { ...tool, ...content } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /tools/:tool_id/share — Mark tool as shared with therapist
router.patch('/:tool_id/share', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);

  try {
    const result = await pool.query(
      `UPDATE tools SET shared_with_therapist = true, shared_at = NOW()
       WHERE id = $1 AND patient_id = $2 RETURNING *`,
      [toolId, patientId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }
    res.json({ tool: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ===== TWENTY REASONS =====

// POST /tools/:tool_id/reasons — Add a reason
router.post('/:tool_id/reasons', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const { reason_number, reason_text } = req.body;

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO twenty_reasons (tool_id, reason_number, reason_text)
       VALUES ($1, $2, $3)
       ON CONFLICT (tool_id, reason_number) DO UPDATE SET reason_text = $3, updated_at = NOW()
       RETURNING *`,
      [toolId, reason_number, reason_text]
    );
    res.json({ reason: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /tools/:tool_id/reasons/:number — Update a reason
router.patch('/:tool_id/reasons/:number', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const reasonNumber = parseInt(req.params.number);
  const { reason_text } = req.body;

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE twenty_reasons SET reason_text = $1, updated_at = NOW()
       WHERE tool_id = $2 AND reason_number = $3 RETURNING *`,
      [reason_text, toolId, reasonNumber]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'السبب غير موجود' });
      return;
    }
    res.json({ reason: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /tools/:tool_id/reasons/:number — Delete a reason
router.delete('/:tool_id/reasons/:number', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const reasonNumber = parseInt(req.params.number);

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  try {
    const result = await pool.query(
      `DELETE FROM twenty_reasons WHERE tool_id = $1 AND reason_number = $2 RETURNING id`,
      [toolId, reasonNumber]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'السبب غير موجود' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ===== BLACK PICTURES =====

// POST /tools/:tool_id/stories — Add a story
router.post('/:tool_id/stories', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const { story_number, story_title, story_text } = req.body;

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO black_pictures (tool_id, story_number, story_title, story_text)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tool_id, story_number) DO UPDATE SET story_title = $3, story_text = $4, updated_at = NOW()
       RETURNING *`,
      [toolId, story_number, story_title, story_text]
    );
    res.json({ story: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /tools/:tool_id/stories/:number — Update a story
router.patch('/:tool_id/stories/:number', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const storyNumber = parseInt(req.params.number);
  const { story_title, story_text } = req.body;

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE black_pictures SET story_title = $1, story_text = $2, updated_at = NOW()
       WHERE tool_id = $3 AND story_number = $4 RETURNING *`,
      [story_title, story_text, toolId, storyNumber]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'القصة غير موجودة' });
      return;
    }
    res.json({ story: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /tools/:tool_id/stories/:number — Delete a story
router.delete('/:tool_id/stories/:number', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const storyNumber = parseInt(req.params.number);

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  try {
    const result = await pool.query(
      `DELETE FROM black_pictures WHERE tool_id = $1 AND story_number = $2 RETURNING id`,
      [toolId, storyNumber]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'القصة غير موجودة' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ===== DAILY PLANNER =====

// POST /tools/:tool_id/planner — Add/upsert a planner hour
router.post('/:tool_id/planner', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const { plan_date, hour, activity_description, risk_level, location, with_whom, exact_time, safety_plan } = req.body;

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  if (!plan_date || hour === undefined || !['low', 'high'].includes(risk_level)) {
    res.status(400).json({ error: 'بيانات ناقصة أو غير صالحة' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO daily_planner (tool_id, plan_date, hour, activity_description, risk_level, location, with_whom, exact_time, safety_plan)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (tool_id, plan_date, hour) DO UPDATE SET
         activity_description = $4, risk_level = $5, location = $6, with_whom = $7, exact_time = $8, safety_plan = $9, updated_at = NOW()
       RETURNING *`,
      [toolId, plan_date, hour, activity_description, risk_level, location, with_whom, exact_time, safety_plan]
    );
    res.json({ activity: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /tools/:tool_id/planner/:date — Get planner for a specific date
router.get('/:tool_id/planner/:date', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const planDate = req.params.date;

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT * FROM daily_planner WHERE tool_id = $1 AND plan_date = $2 ORDER BY hour`,
      [toolId, planDate]
    );
    res.json({ activities: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /tools/:tool_id/planner/:date/:hour — Delete a planner hour
router.delete('/:tool_id/planner/:date/:hour', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const planDate = req.params.date;
  const hour = parseInt(req.params.hour);

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  try {
    const result = await pool.query(
      `DELETE FROM daily_planner WHERE tool_id = $1 AND plan_date = $2 AND hour = $3 RETURNING id`,
      [toolId, planDate, hour]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'النشاط غير موجود' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ===== SAFETY MAP =====

// GET /tools/:tool_id/safety-map — Get all triggers
router.get('/:tool_id/safety-map', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `SELECT * FROM safety_map_triggers WHERE tool_id = $1 ORDER BY category, trigger_name`,
      [toolId]
    );
    res.json({ triggers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /tools/:tool_id/safety-map/triggers — Add a trigger
router.post('/:tool_id/safety-map/triggers', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const { category, trigger_name, trigger_description, notes, category_data } = req.body;

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  if (!category || !trigger_name || !category_data) {
    res.status(400).json({ error: 'بيانات ناقصة' });
    return;
  }

  // Import risk calculation
  const { calculateRiskScore } = await import('../utils/riskCalculation');
  const { score, level } = calculateRiskScore(category, category_data);

  try {
    const result = await pool.query(
      `INSERT INTO safety_map_triggers (tool_id, category, trigger_name, trigger_description, risk_score, risk_level, notes, category_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [toolId, category, trigger_name, trigger_description || null, score, level, notes || null, JSON.stringify(category_data)]
    );
    res.json({ trigger: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /tools/:tool_id/safety-map/triggers/:id — Update trigger
router.patch('/:tool_id/safety-map/triggers/:id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const triggerId = parseInt(req.params.id);
  const { trigger_description, notes, category_data } = req.body;

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  try {
    // Get trigger to determine category
    const triggerCheck = await pool.query(
      `SELECT category FROM safety_map_triggers WHERE id = $1 AND tool_id = $2`,
      [triggerId, toolId]
    );
    if (triggerCheck.rows.length === 0) {
      res.status(404).json({ error: 'المثير غير موجود' });
      return;
    }

    const category = triggerCheck.rows[0].category;

    // Recalculate risk if category_data changed
    let newCategoryData = category_data;
    let score = 50;
    let level: string = 'medium';

    if (category_data) {
      const { calculateRiskScore } = await import('../utils/riskCalculation');
      const result = calculateRiskScore(category, category_data);
      score = result.score;
      level = result.level;
      newCategoryData = category_data;
    }

    const result = await pool.query(
      `UPDATE safety_map_triggers
       SET trigger_description = COALESCE($1, trigger_description),
           notes = COALESCE($2, notes),
           category_data = COALESCE($3, category_data),
           risk_score = $4,
           risk_level = $5,
           updated_at = NOW()
       WHERE id = $6 AND tool_id = $7
       RETURNING *`,
      [trigger_description, notes, newCategoryData ? JSON.stringify(newCategoryData) : null, score, level, triggerId, toolId]
    );
    res.json({ trigger: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /tools/:tool_id/safety-map/triggers/:id — Delete trigger
router.delete('/:tool_id/safety-map/triggers/:id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const triggerId = parseInt(req.params.id);

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  try {
    const result = await pool.query(
      `DELETE FROM safety_map_triggers WHERE id = $1 AND tool_id = $2 RETURNING id`,
      [triggerId, toolId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'المثير غير موجود' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /tools/:tool_id/safety-map/summary — Get statistics
router.get('/:tool_id/safety-map/summary', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `SELECT
        COUNT(*) as total_triggers,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_count,
        COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_count,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_count,
        COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_count,
        MAX(updated_at) as last_updated
       FROM safety_map_triggers WHERE tool_id = $1`,
      [toolId]
    );

    const stats = result.rows[0];
    res.json({
      summary: {
        total_triggers: parseInt(stats.total_triggers),
        by_risk_level: {
          low: parseInt(stats.low_count),
          medium: parseInt(stats.medium_count),
          high: parseInt(stats.high_count),
          critical: parseInt(stats.critical_count)
        },
        last_updated: stats.last_updated
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ============================================================================
// PERSONAL TRIANGLE TOOL ENDPOINTS (المثلث الشخصي)
// ============================================================================

// POST /tools/:tool_id/triangle/messages — Create or replace a message
router.post('/:tool_id/triangle/messages', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const { from_persona, to_persona, message_text } = req.body;

  if (!from_persona || !to_persona || !message_text) {
    res.status(400).json({ error: 'جميع الحقول مطلوبة' });
    return;
  }

  if (from_persona === to_persona) {
    res.status(400).json({ error: 'لا يمكن إرسال رسالة للذات' });
    return;
  }

  const validPersonas = ['victim', 'abuser', 'bystander'];
  if (!validPersonas.includes(from_persona) || !validPersonas.includes(to_persona)) {
    res.status(400).json({ error: 'الشخصيات غير صالحة' });
    return;
  }

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2 AND tool_type = 'personal_triangle'`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO personal_triangle_messages (tool_id, from_persona, to_persona, message_text)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tool_id, from_persona, to_persona) DO UPDATE SET message_text = $4, updated_at = NOW()
       RETURNING *`,
      [toolId, from_persona, to_persona, message_text]
    );
    res.status(201).json({ message: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /tools/:tool_id/triangle/messages — Get all messages
router.get('/:tool_id/triangle/messages', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `SELECT * FROM personal_triangle_messages WHERE tool_id = $1 ORDER BY created_at ASC`,
      [toolId]
    );
    res.json({ messages: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /tools/:tool_id/triangle/messages/:from/:to — Get specific direction message
router.get('/:tool_id/triangle/messages/:from/:to', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const from_persona = req.params.from;
  const to_persona = req.params.to;

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `SELECT * FROM personal_triangle_messages WHERE tool_id = $1 AND from_persona = $2 AND to_persona = $3`,
      [toolId, from_persona, to_persona]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'الرسالة غير موجودة' });
      return;
    }
    res.json({ message: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /tools/:tool_id/triangle/messages/:from/:to — Delete specific direction message
router.delete('/:tool_id/triangle/messages/:from/:to', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const from_persona = req.params.from;
  const to_persona = req.params.to;

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `DELETE FROM personal_triangle_messages WHERE tool_id = $1 AND from_persona = $2 AND to_persona = $3 RETURNING *`,
      [toolId, from_persona, to_persona]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'الرسالة غير موجودة' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /tools/:tool_id/journal/entries — Create or update journal entry for a date
router.post('/:tool_id/journal/entries', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const { journal_date, abuser_thought, intensity, victim_response, bystander_analysis } = req.body;

  if (!journal_date || !abuser_thought) {
    res.status(400).json({ error: 'التاريخ والفكرة المسيئة مطلوبان' });
    return;
  }

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2 AND tool_type = 'personal_triangle'`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO abuser_thought_journal (tool_id, journal_date, abuser_thought, intensity, victim_response, bystander_analysis)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (tool_id, journal_date) DO UPDATE SET abuser_thought = $3, intensity = $4, victim_response = $5, bystander_analysis = $6, updated_at = NOW()
       RETURNING *`,
      [toolId, journal_date, abuser_thought, intensity || 5, victim_response || null, bystander_analysis || null]
    );
    res.status(201).json({ entry: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /tools/:tool_id/journal/entries — List all journal entries
router.get('/:tool_id/journal/entries', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `SELECT * FROM abuser_thought_journal WHERE tool_id = $1 ORDER BY journal_date DESC`,
      [toolId]
    );
    res.json({ entries: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /tools/:tool_id/journal/entries/:date — Get entry for specific date
router.get('/:tool_id/journal/entries/:date', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const journalDate = req.params.date;

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `SELECT * FROM abuser_thought_journal WHERE tool_id = $1 AND journal_date = $2`,
      [toolId, journalDate]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'الإدخال غير موجود' });
      return;
    }
    res.json({ entry: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /tools/:tool_id/journal/entries/:date — Update entry for specific date (alias for POST)
router.patch('/:tool_id/journal/entries/:date', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const journalDate = req.params.date;
  const { abuser_thought, intensity, victim_response, bystander_analysis } = req.body;

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `UPDATE abuser_thought_journal SET abuser_thought = COALESCE($1, abuser_thought), intensity = COALESCE($2, intensity), victim_response = COALESCE($3, victim_response), bystander_analysis = COALESCE($4, bystander_analysis), updated_at = NOW()
       WHERE tool_id = $5 AND journal_date = $6 RETURNING *`,
      [abuser_thought || null, intensity || null, victim_response || null, bystander_analysis || null, toolId, journalDate]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'الإدخال غير موجود' });
      return;
    }
    res.json({ entry: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /tools/:tool_id/journal/entries/:date — Delete entry for specific date
router.delete('/:tool_id/journal/entries/:date', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const journalDate = req.params.date;

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `DELETE FROM abuser_thought_journal WHERE tool_id = $1 AND journal_date = $2 RETURNING *`,
      [toolId, journalDate]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'الإدخال غير موجود' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /tools/:tool_id/journal/export — Export journal as CSV
router.get('/:tool_id/journal/export', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `SELECT journal_date, abuser_thought, intensity, victim_response, bystander_analysis, created_at, updated_at
       FROM abuser_thought_journal WHERE tool_id = $1 ORDER BY journal_date DESC`,
      [toolId]
    );

    const entries = result.rows;
    if (entries.length === 0) {
      res.json({ csv: 'التاريخ,الفكرة المسيئة,الشدة,رد الضحية,تحليل المتفرج,تاريخ الإنشاء,آخر تحديث\n' });
      return;
    }

    // Build CSV
    const headers = 'التاريخ,الفكرة المسيئة,الشدة,رد الضحية,تحليل المتفرج,تاريخ الإنشاء,آخر تحديث';
    const rows = entries.map(entry =>
      [
        entry.journal_date,
        `"${entry.abuser_thought.replace(/"/g, '""')}"`,
        entry.intensity,
        `"${(entry.victim_response || '').replace(/"/g, '""')}"`,
        `"${(entry.bystander_analysis || '').replace(/"/g, '""')}"`,
        entry.created_at,
        entry.updated_at
      ].join(',')
    );

    const csv = headers + '\n' + rows.join('\n');
    res.json({ csv });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ============================================================================
// PROGRAM PRINCIPLES TOOL ENDPOINTS (مبادئ البرنامج)
// ============================================================================

// GET /tools/:tool_id/principles — List all principles with examples
router.get('/:tool_id/principles', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    // Get all principles with their examples
    const result = await pool.query(
      `SELECT p.id, p.tool_id, p.principle_name, p.principle_description, p.created_at, p.updated_at,
              COALESCE(json_agg(json_build_object('id', e.id, 'example_text', e.example_text, 'example_date', e.example_date, 'created_at', e.created_at)) FILTER (WHERE e.id IS NOT NULL), '[]'::json) as examples
       FROM program_principles p
       LEFT JOIN principle_examples e ON p.id = e.principle_id
       WHERE p.tool_id = $1
       GROUP BY p.id, p.tool_id, p.principle_name, p.principle_description, p.created_at, p.updated_at
       ORDER BY p.created_at DESC`,
      [toolId]
    );

    // Sort examples by date descending (newest first) within each principle
    const principles = result.rows.map(p => ({
      ...p,
      examples: p.examples.sort((a: any, b: any) =>
        new Date(b.example_date).getTime() - new Date(a.example_date).getTime()
      )
    }));

    res.json({ principles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /tools/:tool_id/principles — Add a new principle
router.post('/:tool_id/principles', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const { principle_name, principle_description } = req.body;

  if (!principle_name || !principle_description) {
    res.status(400).json({ error: 'اسم المبدأ والوصف مطلوبان' });
    return;
  }

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO program_principles (tool_id, principle_name, principle_description)
       VALUES ($1, $2, $3)
       RETURNING id, tool_id, principle_name, principle_description, created_at, updated_at`,
      [toolId, principle_name, principle_description]
    );

    const principle = { ...result.rows[0], examples: [] };
    res.status(201).json({ principle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /tools/:tool_id/principles/:principle_id — Update principle
router.patch('/:tool_id/principles/:principle_id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const principleId = parseInt(req.params.principle_id);
  const { principle_name, principle_description } = req.body;

  if (!principle_name || !principle_description) {
    res.status(400).json({ error: 'اسم المبدأ والوصف مطلوبان' });
    return;
  }

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `UPDATE program_principles
       SET principle_name = $1, principle_description = $2, updated_at = NOW()
       WHERE id = $3 AND tool_id = $4
       RETURNING id, tool_id, principle_name, principle_description, created_at, updated_at`,
      [principle_name, principle_description, principleId, toolId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'المبدأ غير موجود' });
      return;
    }

    // Fetch examples
    const examplesResult = await pool.query(
      `SELECT id, example_text, example_date, created_at FROM principle_examples WHERE principle_id = $1 ORDER BY example_date DESC`,
      [principleId]
    );

    const principle = { ...result.rows[0], examples: examplesResult.rows };
    res.json({ principle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /tools/:tool_id/principles/:principle_id — Delete principle (cascade deletes examples)
router.delete('/:tool_id/principles/:principle_id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const principleId = parseInt(req.params.principle_id);

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `DELETE FROM program_principles WHERE id = $1 AND tool_id = $2 RETURNING id`,
      [principleId, toolId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'المبدأ غير موجود' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /tools/:tool_id/principles/:principle_id/examples — Add example
router.post('/:tool_id/principles/:principle_id/examples', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const principleId = parseInt(req.params.principle_id);
  const { example_text, example_date } = req.body;

  if (!example_text || !example_date) {
    res.status(400).json({ error: 'نص المثال والتاريخ مطلوبان' });
    return;
  }

  try {
    // Verify tool ownership and principle belongs to this tool
    const toolCheck = await pool.query(
      `SELECT p.* FROM program_principles p
       JOIN tools t ON p.tool_id = t.id
       WHERE p.id = $1 AND p.tool_id = $2 AND t.patient_id = $3`,
      [principleId, toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'المبدأ غير موجود' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO principle_examples (principle_id, example_text, example_date)
       VALUES ($1, $2, $3)
       RETURNING id, principle_id, example_text, example_date, created_at`,
      [principleId, example_text, example_date]
    );

    res.status(201).json({ example: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /tools/:tool_id/principles/:principle_id/examples/:example_id — Delete example
router.delete('/:tool_id/principles/:principle_id/examples/:example_id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const principleId = parseInt(req.params.principle_id);
  const exampleId = parseInt(req.params.example_id);

  try {
    // Verify tool ownership and principle belongs to this tool
    const toolCheck = await pool.query(
      `SELECT p.* FROM program_principles p
       JOIN tools t ON p.tool_id = t.id
       WHERE p.id = $1 AND p.tool_id = $2 AND t.patient_id = $3`,
      [principleId, toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'المبدأ غير موجود' });
      return;
    }

    const result = await pool.query(
      `DELETE FROM principle_examples WHERE id = $1 AND principle_id = $2 RETURNING id`,
      [exampleId, principleId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'المثال غير موجود' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ===== PERSONALITY PROBLEMS (العيوب الشخصيه) =====

// GET /tools/:tool_id/personality-problems — List all problems with examples
router.get('/:tool_id/personality-problems', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    // Get all problems with their examples
    const result = await pool.query(
      `SELECT p.id, p.tool_id, p.problem_name, p.problem_description, p.created_at, p.updated_at,
              COALESCE(json_agg(json_build_object('id', e.id, 'example_text', e.example_text, 'example_date', e.example_date, 'created_at', e.created_at)) FILTER (WHERE e.id IS NOT NULL), '[]'::json) as examples
       FROM personality_problems p
       LEFT JOIN personality_problem_examples e ON p.id = e.problem_id
       WHERE p.tool_id = $1
       GROUP BY p.id, p.tool_id, p.problem_name, p.problem_description, p.created_at, p.updated_at
       ORDER BY p.created_at DESC`,
      [toolId]
    );

    // Sort examples by date descending (newest first) within each problem
    const problems = result.rows.map(p => ({
      ...p,
      examples: p.examples.sort((a: any, b: any) =>
        new Date(b.example_date).getTime() - new Date(a.example_date).getTime()
      )
    }));

    res.json({ problems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /tools/:tool_id/personality-problems — Add a new problem
router.post('/:tool_id/personality-problems', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const { problem_name, problem_description } = req.body;

  if (!problem_name || !problem_description) {
    res.status(400).json({ error: 'اسم العيب والوصف مطلوبان' });
    return;
  }

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO personality_problems (tool_id, problem_name, problem_description)
       VALUES ($1, $2, $3)
       RETURNING id, tool_id, problem_name, problem_description, created_at, updated_at`,
      [toolId, problem_name, problem_description]
    );

    const problem = { ...result.rows[0], examples: [] };
    res.status(201).json({ problem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /tools/:tool_id/personality-problems/:problem_id — Update problem
router.patch('/:tool_id/personality-problems/:problem_id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const problemId = parseInt(req.params.problem_id);
  const { problem_name, problem_description } = req.body;

  if (!problem_name || !problem_description) {
    res.status(400).json({ error: 'اسم العيب والوصف مطلوبان' });
    return;
  }

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `UPDATE personality_problems
       SET problem_name = $1, problem_description = $2, updated_at = NOW()
       WHERE id = $3 AND tool_id = $4
       RETURNING id, tool_id, problem_name, problem_description, created_at, updated_at`,
      [problem_name, problem_description, problemId, toolId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'العيب غير موجود' });
      return;
    }

    // Fetch examples
    const examplesResult = await pool.query(
      `SELECT id, example_text, example_date, created_at FROM personality_problem_examples WHERE problem_id = $1 ORDER BY example_date DESC`,
      [problemId]
    );

    const problem = { ...result.rows[0], examples: examplesResult.rows };
    res.json({ problem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /tools/:tool_id/personality-problems/:problem_id — Delete problem (cascade deletes examples)
router.delete('/:tool_id/personality-problems/:problem_id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const problemId = parseInt(req.params.problem_id);

  try {
    // Verify tool ownership
    const toolCheck = await pool.query(
      `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
      [toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'الأداة غير موجودة' });
      return;
    }

    const result = await pool.query(
      `DELETE FROM personality_problems WHERE id = $1 AND tool_id = $2 RETURNING id`,
      [problemId, toolId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'العيب غير موجود' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /tools/:tool_id/personality-problems/:problem_id/examples — Add example
router.post('/:tool_id/personality-problems/:problem_id/examples', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const problemId = parseInt(req.params.problem_id);
  const { example_text, example_date } = req.body;

  if (!example_text || !example_date) {
    res.status(400).json({ error: 'نص المثال والتاريخ مطلوبان' });
    return;
  }

  try {
    // Verify tool ownership and problem belongs to this tool
    const toolCheck = await pool.query(
      `SELECT p.* FROM personality_problems p
       JOIN tools t ON p.tool_id = t.id
       WHERE p.id = $1 AND p.tool_id = $2 AND t.patient_id = $3`,
      [problemId, toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'العيب غير موجود' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO personality_problem_examples (problem_id, example_text, example_date)
       VALUES ($1, $2, $3)
       RETURNING id, problem_id, example_text, example_date, created_at`,
      [problemId, example_text, example_date]
    );

    res.status(201).json({ example: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /tools/:tool_id/personality-problems/:problem_id/examples/:example_id — Delete example
router.delete('/:tool_id/personality-problems/:problem_id/examples/:example_id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const problemId = parseInt(req.params.problem_id);
  const exampleId = parseInt(req.params.example_id);

  try {
    // Verify tool ownership and problem belongs to this tool
    const toolCheck = await pool.query(
      `SELECT p.* FROM personality_problems p
       JOIN tools t ON p.tool_id = t.id
       WHERE p.id = $1 AND p.tool_id = $2 AND t.patient_id = $3`,
      [problemId, toolId, patientId]
    );
    if (toolCheck.rows.length === 0) {
      res.status(404).json({ error: 'العيب غير موجود' });
      return;
    }

    const result = await pool.query(
      `DELETE FROM personality_problem_examples WHERE id = $1 AND problem_id = $2 RETURNING id`,
      [exampleId, problemId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'المثال غير موجود' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ===== DECISION MATRIX (جدول الأرباح و الخسائر) =====

// POST /tools/:tool_id/decision-matrix/items — Add a new item
router.post('/:tool_id/decision-matrix/items', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const { category, item_text } = req.body;

  // Validate item_text
  if (!item_text || typeof item_text !== 'string' || !item_text.trim()) {
    res.status(400).json({ error: 'النص مطلوب وغير فارغ' });
    return;
  }

  if (item_text.length > 500) {
    res.status(400).json({ error: 'النص طويل جداً (حد أقصى 500 حرف)' });
    return;
  }

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  // Validate category
  const validCategories = ['pros_using', 'cons_using', 'pros_abstinent', 'cons_abstinent'];
  if (!validCategories.includes(category)) {
    res.status(400).json({ error: 'فئة غير صالحة' });
    return;
  }

  try {
    // Get next position_order for this category
    const orderResult = await pool.query(
      `SELECT COALESCE(MAX(position_order), 0) + 1 as next_order FROM decision_matrix_items WHERE tool_id = $1 AND category = $2`,
      [toolId, category]
    );
    const position_order = orderResult.rows[0].next_order;

    const result = await pool.query(
      `INSERT INTO decision_matrix_items (tool_id, category, item_text, position_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [toolId, category, item_text, position_order]
    );
    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /tools/:tool_id/decision-matrix/items/:id — Delete an item
router.delete('/:tool_id/decision-matrix/items/:id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const toolId = parseInt(req.params.tool_id);
  const itemId = parseInt(req.params.id);

  // Verify tool ownership
  const toolCheck = await pool.query(
    `SELECT * FROM tools WHERE id = $1 AND patient_id = $2`,
    [toolId, patientId]
  );
  if (toolCheck.rows.length === 0) {
    res.status(404).json({ error: 'الأداة غير موجودة' });
    return;
  }

  try {
    const result = await pool.query(
      `DELETE FROM decision_matrix_items WHERE id = $1 AND tool_id = $2 RETURNING id`,
      [itemId, toolId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'البند غير موجود' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

export default router;
