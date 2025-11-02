from fastapi import APIRouter, HTTPException
from app.models import (
    ManagerSummarizeRequest,
    ManagerSummarizeResponse,
    ResultsAndPlanRequest,
    ResultsAndPlanResponse,
    StepsOfManagerRequest,
    StepsOfManagerResponse
)
from app.services.llm_service import llm_service
import logging
import traceback

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.post("/manager-summarize", response_model=ManagerSummarizeResponse)
async def manager_summarize(request: ManagerSummarizeRequest):
    """
    Эндпоинт для создания резюме от руководителя на основе оценок и обратной связи

    Returns:
        {
            "summary": "Итоговая обратная связь от руководителя"
        }
    """
    try:
        logger.info(f"Обработка запроса manager-summarize для сотрудника: {request.employee_name}")

        data = request.model_dump() if hasattr(request, 'model_dump') else request.dict()

        result = llm_service.process_manager_summarize(data)

        logger.info(f"Запрос успешно обработан для сотрудника: {request.employee_name}")

        return ManagerSummarizeResponse(summary=result)

    except FileNotFoundError as e:
        logger.error(f"Файл промпта не найден: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка конфигурации: {str(e)}")

    except Exception as e:
        logger.error(f"Ошибка при обработке manager-summarize: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Ошибка обработки: {str(e)}")


@router.post("/results-and-plan", response_model=ResultsAndPlanResponse)
async def results_and_plan(request: ResultsAndPlanRequest):
    """
    Эндпоинт для генерации HR рекомендаций для сотрудника

    Returns:
        {
            "achievements": "Ключевые достижения",
            "improvements": "Области для улучшения",
            "development_plan": "План развития"
        }
    """
    try:
        logger.info(f"Обработка запроса results-and-plan для сотрудника: {request.employee_name}")

        data = request.model_dump() if hasattr(request, 'model_dump') else request.dict()

        result = llm_service.process_results_and_plan(data)

        logger.info(f"Запрос успешно обработан для сотрудника: {request.employee_name}")

        return ResultsAndPlanResponse(**result)

    except FileNotFoundError as e:
        logger.error(f"Файл промпта не найден: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка конфигурации: {str(e)}")

    except Exception as e:
        logger.error(f"Ошибка при обработке results-and-plan: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Ошибка обработки: {str(e)}")


@router.post("/steps-of-manager", response_model=StepsOfManagerResponse)
async def steps_of_manager(request: StepsOfManagerRequest):
    """
    Эндпоинт для генерации управленческих рекомендаций

    Returns:
        {
            "recommendations": "Управленческие рекомендации"
        }
    """
    try:
        logger.info(f"Обработка запроса steps-of-manager для сотрудника: {request.employee_name}")

        data = request.model_dump() if hasattr(request, 'model_dump') else request.dict()

        result = llm_service.process_steps_of_manager(data)

        logger.info(f"Запрос успешно обработан для сотрудника: {request.employee_name}")

        return StepsOfManagerResponse(recommendations=result)

    except FileNotFoundError as e:
        logger.error(f"Файл промпта не найден: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка конфигурации: {str(e)}")

    except Exception as e:
        logger.error(f"Ошибка при обработке steps-of-manager: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Ошибка обработки: {str(e)}")
