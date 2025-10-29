from pydantic import BaseModel, Field
from typing import List, Optional


class Goal(BaseModel):
    """Модель цели сотрудника"""
    goal_title: str
    goal_description: str
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
    technical_skills: int
    communication: int
    teamwork: int
    problem_solving: int
    initiative: int
    strengths: str
    areas_for_improvement: str
    additional_comments: str


class ManagerSummarizeRequest(BaseModel):
    """Модель запроса для эндпоинта manager-summarize"""
    employee_name: str
    goals: List[Goal]
    peer_reviews_general: List[PeerReview]
    manager_comments: str
    self_assessment: Optional[str] = ""


class ResultsAndPlanRequest(BaseModel):
    """Модель запроса для эндпоинта results-and-plan"""
    employee_name: str
    current_results: str
    achievements: List[str]
    challenges: List[str]
    next_quarter_goals: List[str]
    development_areas: List[str]


class StepsOfManagerRequest(BaseModel):
    """Модель запроса для эндпоинта steps-of-manager"""
    employee_name: str
    current_situation: str
    desired_outcome: str
    obstacles: List[str]
    resources: List[str]
    timeline: str


# Модели ответов
class ManagerSummarizeResponse(BaseModel):
    """Модель ответа для эндпоинта manager-summarize"""
    summary: str = Field(..., description="Итоговая обратная связь от руководителя")


class ResultsAndPlanResponse(BaseModel):
    """Модель ответа для эндпоинта results-and-plan"""
    analysis: str = Field(..., description="Анализ результатов и план развития")


class StepsOfManagerResponse(BaseModel):
    """Модель ответа для эндпоинта steps-of-manager"""
    action_plan: str = Field(..., description="План действий руководителя")


# Устаревшая модель для обратной совместимости
class AIResponse(BaseModel):
    """Универсальная модель ответа от AI"""
    result: str
    status: str = "success"
