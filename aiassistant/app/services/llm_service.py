import os
from pathlib import Path
from typing import Dict, Any, Union, List
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)


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

    def _load_multi_section_prompts(self, template_name: str) -> Dict[str, str]:
        """Загрузить файл с несколькими секциями промптов"""
        content = self._load_prompt_template(template_name)

        sections = {}
        current_section = None
        current_content = []

        for line in content.split('\n'):
            # Проверяем, начинается ли строка с маркера секции
            if line.startswith('=== ') and line.endswith(' ==='):
                # Сохраняем предыдущую секцию
                if current_section:
                    sections[current_section] = '\n'.join(current_content).strip()

                # Начинаем новую секцию
                current_section = line.strip('= ').lower()
                current_content = []
            else:
                # Добавляем строку к текущей секции
                if current_section:
                    current_content.append(line)

        # Сохраняем последнюю секцию
        if current_section:
            sections[current_section] = '\n'.join(current_content).strip()

        logger.info(f"Загружено секций из {template_name}: {list(sections.keys())}")

        return sections

    def _format_goals(self, goals: List[Union[Dict, Any]]) -> str:
        """Форматировать список целей"""
        formatted = []
        for i, goal in enumerate(goals, 1):
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

    def _format_self_assessment(self, assessments: List[Union[Dict, Any]]) -> str:
        """Форматировать самооценку сотрудника"""
        if not assessments:
            return "Самооценка не предоставлена"

        formatted = []
        for i, item in enumerate(assessments, 1):
            if isinstance(item, dict):
                data = item
            else:
                data = item.dict() if hasattr(item, 'dict') else item.__dict__

            formatted.append(f"""
Вопрос {i}: {data.get('question_text', 'Не указано')}
Балл: {data.get('answer_score', 0)}/5
Ответ: {data.get('answer_text', 'Не указано')}
Задача: {data.get('task_name', 'Не привязано к задаче')}
Дата: {data.get('created_at', 'Не указано')}
""")
        return "\n".join(formatted)

    def _format_manager_evaluation(self, evaluation: Union[Dict, Any, None]) -> str:
        """Форматировать оценку руководителя"""
        if not evaluation:
            return "Оценка руководителя отсутствует"

        if isinstance(evaluation, dict):
            data = evaluation
        else:
            data = evaluation.dict() if hasattr(evaluation, 'dict') else evaluation.__dict__

        return f"""
Руководитель: {data.get('manager_name', 'Не указано')}
Общая результативность: {data.get('performance_total', 0)}/10
Профессиональные качества: {data.get('professional_qualities_score', 0)}/5
Личные качества: {data.get('personal_qualities_score', 0)}/4
Комментарий: {data.get('comments', 'Не указано')}
"""

    def _format_peer_reviews_detailed(self, reviews: List[Union[Dict, Any]]) -> str:
        """Форматировать детальные отзывы коллег"""
        if not reviews:
            return "Отзывы коллег отсутствуют"

        formatted = []
        for i, review in enumerate(reviews, 1):
            if isinstance(review, dict):
                data = review
            else:
                data = review.dict() if hasattr(review, 'dict') else review.__dict__

            formatted.append(f"""
Отзыв {i}:
От кого: {data.get('reviewer_name', 'Не указано')}
Вопрос: {data.get('question_text', 'Не указано')}
Балл: {data.get('answer_score', 0)}/5
Отзыв: {data.get('answer_text', 'Не указано')}
Задача: {data.get('task_name', 'Не привязано к задаче')}
Дата: {data.get('created_at', 'Не указано')}
""")
        return "\n".join(formatted)

    def _format_potential_assessment(self, assessment: Union[Dict, Any, None]) -> str:
        """Форматировать оценку потенциала"""
        if not assessment:
            return "Оценка потенциала не проводилась"

        if isinstance(assessment, dict):
            data = assessment
        else:
            data = assessment.dict() if hasattr(assessment, 'dict') else assessment.__dict__

        return f"""
Оценка потенциала: {data.get('potential_score', 0)}/10
Оценка результативности: {data.get('performance_score', 0)}/10
Позиция в 9-Box: {data.get('box_position', 'Не определено')}
Готовность к продвижению: {data.get('readiness_timeframe', 'Не определено')}
"""

    def _format_list_items(self, items: List[str]) -> str:
        """Форматировать список строк"""
        return "\n".join([f"- {item}" for item in items])

    def process_manager_summarize(self, data: Dict[str, Any]) -> str:
        """Обработка запроса manager-summarize"""
        try:
            template_str = self._load_prompt_template("manager_summarize")

            goals_formatted = self._format_goals(data.get("goals", []))
            peer_reviews_formatted = self._format_peer_reviews(data.get("peer_reviews_general", []))

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

            formatted_prompt = prompt.format(
                employee_name=data.get("employee_name", "Не указано"),
                goals=goals_formatted,
                peer_reviews=peer_reviews_formatted,
                manager_comments=data.get("manager_comments", "Не указано"),
                self_assessment=data.get("self_assessment") or "Не предоставлена"
            )

            response = self.llm.invoke(formatted_prompt)
            return response.content

        except Exception as e:
            raise Exception(f"Ошибка в process_manager_summarize: {str(e)}")

    def process_results_and_plan(self, data: Dict[str, Any]) -> Dict[str, str]:
        """Обработка запроса results-and-plan (HR рекомендации) - три отдельных запроса"""
        try:
            logger.info(f"Начало обработки results-and-plan для {data.get('employee_name')}")

            # Загружаем три промпта из одного файла
            prompts = self._load_multi_section_prompts("results_and_plan")

            # Подготавливаем общие данные для всех промптов
            common_data = self._prepare_common_data(data)

            # Запрос 1: Достижения
            logger.info("Запрос 1/3: Генерация достижений")
            achievements_prompt = PromptTemplate(
                template=prompts.get('achievements', ''),
                input_variables=list(common_data.keys())
            )
            achievements_formatted = achievements_prompt.format(**common_data)
            achievements_response = self.llm.invoke(achievements_formatted)
            achievements_text = achievements_response.content.strip()
            logger.info(f"Достижения получены: {len(achievements_text)} символов")

            # Запрос 2: Области для улучшения
            logger.info("Запрос 2/3: Генерация областей улучшения")
            improvements_prompt = PromptTemplate(
                template=prompts.get('improvements', ''),
                input_variables=list(common_data.keys())
            )
            improvements_formatted = improvements_prompt.format(**common_data)
            improvements_response = self.llm.invoke(improvements_formatted)
            improvements_text = improvements_response.content.strip()
            logger.info(f"Области улучшения получены: {len(improvements_text)} символов")

            # Запрос 3: План развития
            logger.info("Запрос 3/3: Генерация плана развития")
            plan_prompt = PromptTemplate(
                template=prompts.get('development_plan', ''),
                input_variables=list(common_data.keys())
            )
            plan_formatted = plan_prompt.format(**common_data)
            plan_response = self.llm.invoke(plan_formatted)
            plan_text = plan_response.content.strip()
            logger.info(f"План развития получен: {len(plan_text)} символов")

            result = {
                "achievements": achievements_text,
                "improvements": improvements_text,
                "development_plan": plan_text
            }

            logger.info("Обработка results-and-plan завершена успешно")
            return result

        except Exception as e:
            logger.error(f"Ошибка в process_results_and_plan: {str(e)}")
            raise Exception(f"Ошибка в process_results_and_plan: {str(e)}")

    def _prepare_common_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Подготовить общие данные для форматирования промптов"""
        self_assessment_formatted = self._format_self_assessment(data.get("self_assessment", []))
        manager_evaluation_formatted = self._format_manager_evaluation(data.get("manager_evaluation"))
        peer_reviews_formatted = self._format_peer_reviews_detailed(data.get("peer_reviews", []))
        potential_assessment_formatted = self._format_potential_assessment(data.get("potential_assessment"))

        return {
            "employee_name": data.get("employee_name", "Не указано"),
            "position": data.get("position", "Не указано"),
            "self_score": data.get("self_score", 0),
            "manager_score": data.get("manager_score", 0),
            "peer_score": data.get("peer_score", 0),
            "total_score": data.get("total_score", 0),
            "evaluation_status": data.get("evaluation_status", "Не указано"),
            "self_assessment": self_assessment_formatted,
            "manager_evaluation": manager_evaluation_formatted,
            "peer_reviews": peer_reviews_formatted,
            "potential_assessment": potential_assessment_formatted
        }

    def process_steps_of_manager(self, data: Dict[str, Any]) -> str:
        """Обработка запроса steps-of-manager (Управленческие рекомендации)"""
        try:
            template_str = self._load_prompt_template("steps_of_manager")

            self_assessment_formatted = self._format_self_assessment(data.get("self_assessment", []))
            manager_evaluation_formatted = self._format_manager_evaluation(data.get("manager_evaluation"))
            peer_reviews_formatted = self._format_peer_reviews_detailed(data.get("peer_reviews", []))
            potential_assessment_formatted = self._format_potential_assessment(data.get("potential_assessment"))

            prompt = PromptTemplate(
                template=template_str,
                input_variables=[
                    "employee_name",
                    "position",
                    "self_score",
                    "manager_score",
                    "peer_score",
                    "total_score",
                    "evaluation_status",
                    "self_assessment",
                    "manager_evaluation",
                    "peer_reviews",
                    "potential_assessment"
                ]
            )

            formatted_prompt = prompt.format(
                employee_name=data.get("employee_name", "Не указано"),
                position=data.get("position", "Не указано"),
                self_score=data.get("self_score", 0),
                manager_score=data.get("manager_score", 0),
                peer_score=data.get("peer_score", 0),
                total_score=data.get("total_score", 0),
                evaluation_status=data.get("evaluation_status", "Не указано"),
                self_assessment=self_assessment_formatted,
                manager_evaluation=manager_evaluation_formatted,
                peer_reviews=peer_reviews_formatted,
                potential_assessment=potential_assessment_formatted
            )

            response = self.llm.invoke(formatted_prompt)
            return response.content

        except Exception as e:
            raise Exception(f"Ошибка в process_steps_of_manager: {str(e)}")


# Singleton instance
llm_service = LLMService()
