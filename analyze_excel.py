"""
Скрипт для анализа Excel файла с данными Performance Review
Анализирует все листы, столбцы, типы данных и связи между таблицами
"""

import pandas as pd
import numpy as np
from pathlib import Path
import json

def analyze_excel_file(file_path):
    """
    Анализирует Excel файл и выводит структуру данных для создания БД
    """
    print(f"\n{'='*80}")
    print(f"АНАЛИЗ ФАЙЛА: {file_path}")
    print(f"{'='*80}\n")
    
    # Читаем все листы
    excel_file = pd.ExcelFile(file_path)
    sheet_names = excel_file.sheet_names
    
    print(f"Найдено листов: {len(sheet_names)}")
    print(f"Названия листов: {', '.join(sheet_names)}\n")
    
    analysis_result = {
        'sheets': {},
        'relationships': [],
        'database_schema': {}
    }
    
    # Анализируем каждый лист
    for sheet_name in sheet_names:
        print(f"\n{'─'*80}")
        print(f"ЛИСТ: {sheet_name}")
        print(f"{'─'*80}")
        
        df = pd.read_excel(file_path, sheet_name=sheet_name)
        
        # Основная информация
        print(f"\nКоличество строк: {len(df)}")
        print(f"Количество столбцов: {len(df.columns)}")
        
        # Анализ столбцов
        print(f"\nСТРУКТУРА СТОЛБЦОВ:")
        print(f"{'─'*80}")
        
        sheet_info = {
            'row_count': len(df),
            'columns': {},
            'sample_data': {}
        }
        
        for col in df.columns:
            # Определяем тип данных
            dtype = df[col].dtype
            null_count = df[col].isnull().sum()
            null_percent = (null_count / len(df)) * 100
            unique_count = df[col].nunique()
            
            # Примеры значений (не пустые)
            sample_values = df[col].dropna().head(3).tolist()
            
            # Определяем SQL тип
            sql_type = determine_sql_type(df[col])
            
            print(f"\n  📋 {col}")
            print(f"     Тип Python: {dtype}")
            print(f"     SQL тип: {sql_type}")
            print(f"     Пустых значений: {null_count} ({null_percent:.1f}%)")
            print(f"     Уникальных значений: {unique_count}")
            print(f"     Примеры: {sample_values}")
            
            sheet_info['columns'][col] = {
                'python_type': str(dtype),
                'sql_type': sql_type,
                'null_count': int(null_count),
                'null_percent': float(null_percent),
                'unique_count': int(unique_count),
                'is_potential_key': unique_count == len(df) and null_count == 0,
                'is_potential_foreign_key': col.lower().endswith('_id') or 'id' in col.lower()
            }
            
            sheet_info['sample_data'][col] = [str(v) for v in sample_values]
        
        # Выводим первые 3 строки для понимания данных
        print(f"\n\nПЕРВЫЕ 3 СТРОКИ ДАННЫХ:")
        print(f"{'─'*80}")
        print(df.head(3).to_string())
        
        # Ищем потенциальные ключи
        print(f"\n\nПОТЕНЦИАЛЬНЫЕ КЛЮЧИ:")
        print(f"{'─'*80}")
        for col in df.columns:
            if df[col].nunique() == len(df) and df[col].isnull().sum() == 0:
                print(f"  🔑 PRIMARY KEY: {col}")
            elif col.lower().endswith('_id') or 'id' in col.lower():
                print(f"  🔗 FOREIGN KEY: {col}")
        
        analysis_result['sheets'][sheet_name] = sheet_info
    
    # Генерируем SQL схему
    print(f"\n\n{'='*80}")
    print("ПРЕДЛОЖЕННАЯ SQL СХЕМА ДЛЯ POSTGRESQL")
    print(f"{'='*80}\n")
    
    for sheet_name, sheet_info in analysis_result['sheets'].items():
        table_name = sheet_name.lower().replace(' ', '_').replace('-', '_')
        print(f"\n-- Таблица: {table_name}")
        print(f"CREATE TABLE {table_name} (")
        
        columns_sql = []
        primary_keys = []
        
        for col_name, col_info in sheet_info['columns'].items():
            col_sql_name = col_name.lower().replace(' ', '_').replace('-', '_')
            sql_type = col_info['sql_type']
            nullable = "NULL" if col_info['null_percent'] > 0 else "NOT NULL"
            
            columns_sql.append(f"    {col_sql_name} {sql_type} {nullable}")
            
            if col_info['is_potential_key']:
                primary_keys.append(col_sql_name)
        
        print(",\n".join(columns_sql))
        
        if primary_keys:
            print(f",\n    PRIMARY KEY ({', '.join(primary_keys)})")
        
        print(");\n")
        
        # Индексы для foreign keys
        for col_name, col_info in sheet_info['columns'].items():
            if col_info['is_potential_foreign_key']:
                col_sql_name = col_name.lower().replace(' ', '_').replace('-', '_')
                print(f"CREATE INDEX idx_{table_name}_{col_sql_name} ON {table_name}({col_sql_name});")
    
    # Сохраняем анализ в JSON
    output_file = Path(file_path).stem + '_analysis.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis_result, f, ensure_ascii=False, indent=2)
    
    print(f"\n\n{'='*80}")
    print(f"Анализ сохранен в файл: {output_file}")
    print(f"{'='*80}\n")
    
    return analysis_result


def determine_sql_type(series):
    """
    Определяет подходящий SQL тип данных на основе pandas Series
    """
    dtype = series.dtype
    
    # Числовые типы
    if pd.api.types.is_integer_dtype(dtype):
        max_val = series.max() if len(series) > 0 else 0
        if pd.isna(max_val):
            return "INTEGER"
        if max_val < 32767:
            return "SMALLINT"
        elif max_val < 2147483647:
            return "INTEGER"
        else:
            return "BIGINT"
    
    if pd.api.types.is_float_dtype(dtype):
        return "DECIMAL(10, 2)"
    
    # Даты
    if pd.api.types.is_datetime64_any_dtype(dtype):
        return "TIMESTAMP"
    
    # Булевы
    if pd.api.types.is_bool_dtype(dtype):
        return "BOOLEAN"
    
    # Строки
    if pd.api.types.is_string_dtype(dtype) or dtype == object:
        # Проверяем максимальную длину строк
        max_length = series.astype(str).str.len().max()
        if pd.isna(max_length):
            return "VARCHAR(255)"
        if max_length < 50:
            return "VARCHAR(50)"
        elif max_length < 255:
            return "VARCHAR(255)"
        else:
            return "TEXT"
    
    return "TEXT"


if __name__ == "__main__":
    import sys
    
    # Путь к Excel файлу
    if len(sys.argv) > 1:
        excel_path = sys.argv[1]
    else:
        # Ищем Excel файлы в текущей директории
        excel_files = list(Path('.').glob('*.xlsx')) + list(Path('.').glob('*.xls'))
        
        if not excel_files:
            print("❌ Excel файл не найден!")
            print("\nИспользование:")
            print("  python analyze_excel.py путь/к/файлу.xlsx")
            print("\nИли положите .xlsx файл в текущую директорию")
            sys.exit(1)
        
        if len(excel_files) == 1:
            excel_path = excel_files[0]
            print(f"✅ Найден файл: {excel_path}\n")
        else:
            print("📁 Найдено несколько Excel файлов:")
            for i, f in enumerate(excel_files, 1):
                print(f"  {i}. {f}")
            choice = input("\nВыберите номер файла: ")
            excel_path = excel_files[int(choice) - 1]
    
    # Анализируем файл
    try:
        analyze_excel_file(excel_path)
        print("\n✅ Анализ завершен успешно!")
    except Exception as e:
        print(f"\n❌ Ошибка при анализе: {e}")
        import traceback
        traceback.print_exc()
