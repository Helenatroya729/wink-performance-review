from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# Модели для manager-summarize (остались без изменений)
class Goal(BaseModel):
    """Модель цели сотрудника"""
    result_achievement_rating: int
    personal_qualities_comment: str
    personal_contribution_comment: str
    interaction_quality_rating: int
    improvement_suggestions: str
    overall_rating: int


class PeerReview(BaseModel):
    """Модель обратной связи от коллеги"""
    author: str
    position: str
    personal_qualities: str
    improvement_suggestions: str
    result_achievement_rating: int
    interaction_quality_rating: int


class ManagerSummarizeRequest(BaseModel):
    """Модель запроса для эндпоинта manager-summarize"""
    employee_name: str
    goals: List[Goal]
    peer_reviews_general: List[PeerReview]
    manager_comments: str
    self_assessment: Optional[str] = ""


# Новые модели для results-and-plan и steps-of-manager
class SelfAssessmentItem(BaseModel):
    """Модель элемента самооценки"""
    question_text: str
    answer_score: float
    answer_text: str
    task_name: Optional[str] = None
    created_at: str


class ManagerEvaluation(BaseModel):
    """Модель оценки от руководителя"""
    performance_total: float
    professional_qualities_score: float
    personal_qualities_score: float
    comments: str
    manager_name: str


class PeerReviewItem(BaseModel):
    """Модель отзыва коллеги"""
    reviewer_name: str
    answer_score: float
    answer_text: str
    question_text: str
    task_name: Optional[str] = None
    created_at: str


class PotentialAssessment(BaseModel):
    """Модель оценки потенциала"""
    potential_score: float
    performance_score: float
    box_position: str
    readiness_timeframe: str


class ResultsAndPlanRequest(BaseModel):
    """Модель запроса для эндпоинта results-and-plan (HR рекомендации)"""
    employee_name: str
    position: str
    self_score: float
    manager_score: float
    peer_score: float
    total_score: float
    evaluation_status: str
    self_assessment: List[SelfAssessmentItem]
    manager_evaluation: Optional[ManagerEvaluation] = None
    peer_reviews: List[PeerReviewItem]
    potential_assessment: Optional[PotentialAssessment] = None


class StepsOfManagerRequest(BaseModel):
    """Модель запроса для эндпоинта steps-of-manager (Управленческие рекомендации)"""
    employee_name: str
    position: str
    self_score: float
    manager_score: float
    peer_score: float
    total_score: float
    evaluation_status: str
    self_assessment: List[SelfAssessmentItem]
    manager_evaluation: Optional[ManagerEvaluation] = None
    peer_reviews: List[PeerReviewItem]
    potential_assessment: Optional[PotentialAssessment] = None


# Модели ответов
class ManagerSummarizeResponse(BaseModel):
    """Модель ответа для эндпоинта manager-summarize"""
    summary: str = Field(..., description="Итоговая обратная связь от руководителя")


class ResultsAndPlanResponse(BaseModel):
    """Модель ответа для эндпоинта results-and-plan"""
    achievements: str = Field(..., description="Ключевые достижения сотрудника")
    improvements: str = Field(..., description="Области для улучшения")
    development_plan: str = Field(..., description="План развития сотрудника")


class StepsOfManagerResponse(BaseModel):
    """Модель ответа для эндпоинта steps-of-manager"""
    recommendations: str = Field(..., description="Управленческие рекомендации")


# Устаревшая модель для обратной совместимости
class AIResponse(BaseModel):
    """Универсальная модель ответа от AI"""
    result: str
    status: str = "success"
