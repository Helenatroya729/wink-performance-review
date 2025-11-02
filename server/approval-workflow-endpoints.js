// Добавить эти endpoints в api/index.js

// ==================== EARLY PR WORKFLOW ENDPOINTS ====================

// 1. Запрос раннего PR от сотрудника
app.post('/api/review-periods/:periodId/request-early', authenticateToken, async (req, res) => {
  try {
    const periodId = parseInt(req.params.periodId);
    const userId = req.user.id;

    // Проверяем, что период принадлежит пользователю
    const period = await query(
      'SELECT * FROM employee_review_periods WHERE id = $1 AND user_id = $2',
      [periodId, userId]
    );

    if (period.rows.length === 0) {
      return res.status(404).json({ error: 'Период не найден' });
    }

    // Обновляем статус периода
    await query(`
      UPDATE employee_review_periods
      SET status = 'pending_manager_approval',
          requested_early_at = NOW()
      WHERE id = $1
    `, [periodId]);

    // Получаем информацию о пользователе и его руководителе
    const userInfo = await query(
      'SELECT u.*, m.id as manager_id, m.first_name as manager_first_name, m.last_name as manager_last_name FROM users u LEFT JOIN users m ON u.manager_id = m.id WHERE u.id = $1',
      [userId]
    );

    if (userInfo.rows[0].manager_id) {
      // Создаем уведомление для руководителя
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_user_id, related_id, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
      `, [
        userInfo.rows[0].manager_id,
        'early_pr_request',
        'Запрос раннего Performance Review',
        `${userInfo.rows[0].first_name} ${userInfo.rows[0].last_name} запросил ранний Performance Review`,
        userId,
        periodId
      ]);
    }

    res.json({ 
      success: true, 
      message: 'Запрос отправлен руководителю на утверждение',
      period: period.rows[0]
    });

  } catch (error) {
    console.error('Error requesting early PR:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Утверждение руководителем
app.post('/api/review-periods/:periodId/manager-approve', authenticateToken, async (req, res) => {
  try {
    const periodId = parseInt(req.params.periodId);
    const managerId = req.user.id;

    // Проверяем, что пользователь - руководитель этого сотрудника
    const period = await query(`
      SELECT erp.*, u.manager_id, u.first_name, u.last_name
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.id = $1 AND u.manager_id = $2
    `, [periodId, managerId]);

    if (period.rows.length === 0) {
      return res.status(403).json({ error: 'Вы не являетесь руководителем этого сотрудника' });
    }

    // Обновляем статус периода
    await query(`
      UPDATE employee_review_periods
      SET status = 'pending_hr_approval',
          manager_approved = true,
          manager_approved_at = NOW(),
          manager_approved_by = $1
      WHERE id = $2
    `, [managerId, periodId]);

    // Получаем всех HR
    const hrUsers = await query('SELECT id FROM users WHERE role = $1', ['hr']);

    // Создаем уведомления для всех HR
    for (const hr of hrUsers.rows) {
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_user_id, related_id, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
      `, [
        hr.id,
        'early_pr_hr_approval',
        'Требуется утверждение раннего PR',
        `Руководитель утвердил ранний Performance Review для ${period.rows[0].first_name} ${period.rows[0].last_name}`,
        period.rows[0].user_id,
        periodId
      ]);
    }

    res.json({ 
      success: true, 
      message: 'Запрос отправлен HR на утверждение'
    });

  } catch (error) {
    console.error('Error approving by manager:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Отклонение руководителем
app.post('/api/review-periods/:periodId/manager-reject', authenticateToken, async (req, res) => {
  try {
    const periodId = parseInt(req.params.periodId);
    const managerId = req.user.id;
    const { reason } = req.body;

    // Проверяем, что пользователь - руководитель этого сотрудника
    const period = await query(`
      SELECT erp.*, u.manager_id, u.first_name, u.last_name, u.id as employee_id
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.id = $1 AND u.manager_id = $2
    `, [periodId, managerId]);

    if (period.rows.length === 0) {
      return res.status(403).json({ error: 'Вы не являетесь руководителем этого сотрудника' });
    }

    // Обновляем статус периода
    await query(`
      UPDATE employee_review_periods
      SET status = 'rejected_by_manager'
      WHERE id = $1
    `, [periodId]);

    // Уведомляем сотрудника
    await query(`
      INSERT INTO notifications (user_id, type, title, message, related_id, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, false, NOW())
    `, [
      period.rows[0].employee_id,
      'early_pr_rejected',
      'Запрос на ранний PR отклонен',
      `Руководитель отклонил ваш запрос на ранний Performance Review. Причина: ${reason || 'не указана'}`,
      periodId
    ]);

    res.json({ 
      success: true, 
      message: 'Запрос отклонен'
    });

  } catch (error) {
    console.error('Error rejecting by manager:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Утверждение HR
app.post('/api/review-periods/:periodId/hr-approve', authenticateToken, async (req, res) => {
  try {
    const periodId = parseInt(req.params.periodId);
    const hrId = req.user.id;

    // Проверяем, что пользователь - HR
    if (req.user.role !== 'hr') {
      return res.status(403).json({ error: 'Только HR может утверждать' });
    }

    const period = await query(`
      SELECT erp.*, u.first_name, u.last_name, u.id as employee_id
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.id = $1
    `, [periodId]);

    if (period.rows.length === 0) {
      return res.status(404).json({ error: 'Период не найден' });
    }

    // Обновляем статус периода
    await query(`
      UPDATE employee_review_periods
      SET status = 'in_progress',
          hr_approved = true,
          hr_approved_at = NOW(),
          hr_approved_by = $1
      WHERE id = $2
    `, [hrId, periodId]);

    // Уведомляем сотрудника
    await query(`
      INSERT INTO notifications (user_id, type, title, message, related_id, is_read, created_at)
      VALUES ($1, $2, $3, $4, $5, false, NOW())
    `, [
      period.rows[0].employee_id,
      'early_pr_approved',
      'Ранний PR утвержден',
      'Ваш запрос на ранний Performance Review утвержден. Вы можете приступить к самооценке и запросить обратную связь от коллег.',
      periodId
    ]);

    res.json({ 
      success: true, 
      message: 'Performance Review утвержден'
    });

  } catch (error) {
    console.error('Error approving by HR:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Получение периодов с их статусом для сотрудника
app.get('/api/review-periods/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT 
        erp.*,
        u.first_name,
        u.last_name,
        u.position,
        (SELECT COUNT(*) FROM peer_feedback_requests 
         WHERE requester_id = u.id AND period_id = erp.id AND status = 'completed') as completed_peer_reviews
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.user_id = $1
      ORDER BY erp.start_date DESC
    `, [userId]);

    res.json(result.rows);

  } catch (error) {
    console.error('Error getting my review periods:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Получение периодов, ожидающих утверждения руководителя
app.get('/api/review-periods/pending-manager-approval', authenticateToken, async (req, res) => {
  try {
    const managerId = req.user.id;

    const result = await query(`
      SELECT 
        erp.*,
        u.first_name,
        u.last_name,
        u.position,
        u.email
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE u.manager_id = $1 AND erp.status = 'pending_manager_approval'
      ORDER BY erp.requested_early_at DESC
    `, [managerId]);

    res.json(result.rows);

  } catch (error) {
    console.error('Error getting pending approvals:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Получение периодов, ожидающих утверждения HR
app.get('/api/review-periods/pending-hr-approval', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ error: 'Только для HR' });
    }

    const result = await query(`
      SELECT 
        erp.*,
        u.first_name,
        u.last_name,
        u.position,
        u.email,
        m.first_name as manager_first_name,
        m.last_name as manager_last_name
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      LEFT JOIN users m ON u.manager_id = m.id
      WHERE erp.status = 'pending_hr_approval'
      ORDER BY erp.manager_approved_at DESC
    `, []);

    res.json(result.rows);

  } catch (error) {
    console.error('Error getting HR pending approvals:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Обновление счетчика peer reviews при завершении
app.post('/api/peer-feedback/:requestId/complete', authenticateToken, async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    const reviewerId = req.user.id;

    // Получаем информацию о запросе
    const request = await query(
      'SELECT * FROM peer_feedback_requests WHERE id = $1 AND reviewer_id = $2',
      [requestId, reviewerId]
    );

    if (request.rows.length === 0) {
      return res.status(404).json({ error: 'Запрос не найден' });
    }

    // Обновляем статус запроса
    await query(`
      UPDATE peer_feedback_requests
      SET status = 'completed',
          completed_at = NOW()
      WHERE id = $1
    `, [requestId]);

    // Обновляем счетчик peer reviews в периоде
    await query(`
      UPDATE employee_review_periods
      SET peer_reviews_count = (
        SELECT COUNT(*) FROM peer_feedback_requests 
        WHERE requester_id = $1 AND period_id = $2 AND status = 'completed'
      )
      WHERE id = $2
    `, [request.rows[0].requester_id, request.rows[0].period_id]);

    // Проверяем, набралось ли минимум 3 отзыва
    const period = await query(`
      SELECT erp.*, u.manager_id, u.first_name, u.last_name
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.id = $1
    `, [request.rows[0].period_id]);

    if (period.rows.length > 0 && period.rows[0].peer_reviews_count >= 3 && period.rows[0].self_assessment_completed) {
      // Уведомляем руководителя
      if (period.rows[0].manager_id) {
        await query(`
          INSERT INTO notifications (user_id, type, title, message, related_user_id, related_id, is_read, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
        `, [
          period.rows[0].manager_id,
          'ready_for_manager_evaluation',
          'Готово к оценке сотрудника',
          `${period.rows[0].first_name} ${period.rows[0].last_name} завершил(а) самооценку и получил(а) обратную связь от коллег. Вы можете провести оценку.`,
          period.rows[0].user_id,
          period.rows[0].id
        ]);
      }
    }

    res.json({ 
      success: true,
      message: 'Обратная связь сохранена'
    });

  } catch (error) {
    console.error('Error completing peer feedback:', error);
    res.status(500).json({ error: error.message });
  }
});

// 9. Отметка о завершении самооценки
app.post('/api/review-periods/:periodId/complete-self-assessment', authenticateToken, async (req, res) => {
  try {
    const periodId = parseInt(req.params.periodId);
    const userId = req.user.id;

    // Проверяем, что период принадлежит пользователю
    const period = await query(`
      SELECT erp.*, u.manager_id, u.first_name, u.last_name
      FROM employee_review_periods erp
      JOIN users u ON erp.user_id = u.id
      WHERE erp.id = $1 AND erp.user_id = $2
    `, [periodId, userId]);

    if (period.rows.length === 0) {
      return res.status(404).json({ error: 'Период не найден' });
    }

    // Обновляем статус
    await query(`
      UPDATE employee_review_periods
      SET self_assessment_completed = true,
          self_assessment_completed_at = NOW()
      WHERE id = $1
    `, [periodId]);

    // Проверяем, набралось ли минимум 3 отзыва от коллег
    if (period.rows[0].peer_reviews_count >= 3) {
      // Уведомляем руководителя
      if (period.rows[0].manager_id) {
        await query(`
          INSERT INTO notifications (user_id, type, title, message, related_user_id, related_id, is_read, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
        `, [
          period.rows[0].manager_id,
          'ready_for_manager_evaluation',
          'Готово к оценке сотрудника',
          `${period.rows[0].first_name} ${period.rows[0].last_name} завершил(а) самооценку и получил(а) обратную связь от коллег. Вы можете провести оценку.`,
          userId,
          periodId
        ]);
      }
    }

    res.json({ 
      success: true,
      message: 'Самооценка завершена'
    });

  } catch (error) {
    console.error('Error completing self assessment:', error);
    res.status(500).json({ error: error.message });
  }
});
