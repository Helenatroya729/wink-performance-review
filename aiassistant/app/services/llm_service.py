import os
from pathlib import Path
from typing import Dict, Any, Union, List
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from app.config import get_settings


class LLMService:
    """Сервис для работы с LLM"""
    
    def __init__(self):
        self.settings = get_settings()
        self._setup_llm()
    
    def _setup_llm(self):
        """Настройка LLM"""
        os.environ["OPENAI_API_KEY"] = self.settings.openai_api_key
        
        params = {
            "temperature": self.settings.openai_temperature,
            "base_url": self.settings.openai_base_url,
            "model": self.settings.openai_model,
        }
        
        self.llm = ChatOpenAI(**params)
    
    def _load_prompt_template(self, template_name: str) -> str:
        """Загрузить шаблон промпта из файла"""
        template_path = self.settings.prompts_dir / f"{template_name}.txt"
        
        if not template_path.exists():
            raise FileNotFoundError(f"Шаблон промпта не найден: {template_path}")
        
        with open(template_path, "r", encoding="utf-8") as f:
            return f.read()
    
    def _format_goals(self, goals: List[Union[Dict, Any]]) -> str:
        """Форматировать список целей"""
        formatted = []
        for i, goal in enumerate(goals, 1):
            # Поддержка как словарей, так и объектов Pydantic
            if isinstance(goal, dict):
                goal_data = goal
            else:
                goal_data = goal.dict() if hasattr(goal, 'dict') else goal.__dict__
            
            formatted.append(f"""
Оценка {i}:
Оценка достижения результата: {goal_data.get('result_achievement_rating', 0)}/10
Комментарий о личных качествах: {goal_data.get('personal_qualities_comment', 'Не указано')}
Комментарий о личном вкладе: {goal_data.get('personal_contribution_comment', 'Не указано')}
Оценка качества взаимодействия: {goal_data.get('interaction_quality_rating', 0)}/10
Предложения по улучшению: {goal_data.get('improvement_suggestions', 'Не указано')}
Общая оценка: {goal_data.get('overall_rating', 0)}/10
""")
        return "\n".join(formatted)
    
    def _format_peer_reviews(self, reviews: List[Union[Dict, Any]]) -> str:
        """Форматировать обратную связь от коллег"""
        formatted = []
        for i, review in enumerate(reviews, 1):
            # Поддержка как словарей, так и объектов Pydantic
            if isinstance(review, dict):
                review_data = review
            else:
                review_data = review.dict() if hasattr(review, 'dict') else review.__dict__
            
            formatted.append(f"""
Отзыв {i}:
Автор: {review_data.get('author', 'Не указано')} ({review_data.get('position', 'Не указано')})
Личные качества: {review_data.get('personal_qualities', 'Не указано')}
Предложения по улучшению: {review_data.get('improvement_suggestions', 'Не указано')}
Оценка достижения результата: {review_data.get('result_achievement_rating', 0)}/10
Оценка качества взаимодействия: {review_data.get('interaction_quality_rating', 0)}/10
""")
        return "\n".join(formatted)
    
    def _format_list_items(self, items: List[str]) -> str:
        """Форматировать список строк"""
        return "\n".join([f"- {item}" for item in items])
    
    def process_manager_summarize(self, data: Dict[str, Any]) -> str:
        """Обработка запроса manager-summarize"""
        try:
            template_str = self._load_prompt_template("manager_summarize")
            
            # Форматируем данные
            goals_formatted = self._format_goals(data.get("goals", []))
            peer_reviews_formatted = self._format_peer_reviews(data.get("peer_reviews_general", []))
            
            # Создаем промпт
            prompt = PromptTemplate(
                template=template_str,
                input_variables=[
                    "employee_name",
                    "goals",
                    "peer_reviews",
                    "manager_comments",
                    "self_assessment"
                ]
            )
            
            # Формируем финальный промпт
            formatted_prompt = prompt.format(
                employee_name=data.get("employee_name", "Не указано"),
                goals=goals_formatted,
                peer_reviews=peer_reviews_formatted,
                manager_comments=data.get("manager_comments", "Не указано"),
                self_assessment=data.get("self_assessment") or "Не предоставлена"
            )
            
            # Получаем ответ от LLM
            response = self.llm.invoke(formatted_prompt)
            return response.content
        
        except Exception as e:
            raise Exception(f"Ошибка в process_manager_summarize: {str(e)}")
    
    def process_results_and_plan(self, data: Dict[str, Any]) -> str:
        """Обработка запроса results-and-plan"""
        try:
            template_str = self._load_prompt_template("results_and_plan")
            
            prompt = PromptTemplate(
                template=template_str,
                input_variables=[
                    "employee_name",
                    "current_results",
                    "achievements",
                    "challenges",
                    "next_quarter_goals",
                    "development_areas"
                ]
            )
            
            formatted_prompt = prompt.format(
                employee_name=data.get("employee_name", "Не указано"),
                current_results=data.get("current_results", "Не указано"),
                achievements=self._format_list_items(data.get("achievements", [])),
                challenges=self._format_list_items(data.get("challenges", [])),
                next_quarter_goals=self._format_list_items(data.get("next_quarter_goals", [])),
                development_areas=self._format_list_items(data.get("development_areas", []))
            )
            
            response = self.llm.invoke(formatted_prompt)
            return response.content
        
        except Exception as e:
            raise Exception(f"Ошибка в process_results_and_plan: {str(e)}")
    
    def process_steps_of_manager(self, data: Dict[str, Any]) -> str:
        """Обработка запроса steps-of-manager"""
        try:
            template_str = self._load_prompt_template("steps_of_manager")
            
            prompt = PromptTemplate(
                template=template_str,
                input_variables=[
                    "employee_name",
                    "current_situation",
                    "desired_outcome",
                    "obstacles",
                    "resources",
                    "timeline"
                ]
            )
            
            formatted_prompt = prompt.format(
                employee_name=data.get("employee_name", "Не указано"),
                current_situation=data.get("current_situation", "Не указано"),
                desired_outcome=data.get("desired_outcome", "Не указано"),
                obstacles=self._format_list_items(data.get("obstacles", [])),
                resources=self._format_list_items(data.get("resources", [])),
                timeline=data.get("timeline", "Не указано")
            )
            
            response = self.llm.invoke(formatted_prompt)
            return response.content
        
        except Exception as e:
            raise Exception(f"Ошибка в process_steps_of_manager: {str(e)}")


# Singleton instance
llm_service = LLMService()
