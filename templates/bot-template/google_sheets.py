# -*- coding: utf-8 -*-
"""
Google Sheets Integration
Работа с Google Таблицами как с базой данных
"""

import json
import os
from typing import List, Dict, Optional, Any
from google.oauth2 import service_account
from googleapiclient.discovery import build


class GoogleSheetsDB:
    """Класс для работы с Google Таблицами"""
    
    SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
    
    def __init__(self, credentials_path: str = None, credentials_json: str = None, spreadsheet_id: str = None):
        """
        Инициализация подключения
        
        Args:
            credentials_path: Путь к JSON файлу с credentials
            credentials_json: JSON строка с credentials
            spreadsheet_id: ID Google Таблицы
        """
        self.spreadsheet_id = spreadsheet_id or os.getenv('GOOGLE_SHEET_ID')
        self.service = None
        self.credentials = None
        
        # Загрузка credentials
        if credentials_json:
            self.credentials = service_account.Credentials.from_service_account_info(
                json.loads(credentials_json),
                scopes=self.SCOPES
            )
        elif credentials_path:
            self.credentials = service_account.Credentials.from_service_account_file(
                credentials_path,
                scopes=self.SCOPES
            )
        
        if self.credentials:
            self.service = build('sheets', 'v4', credentials=self.credentials)
    
    def get_values(self, sheet_name: str, range: str = 'A:Z') -> List[List[str]]:
        """
        Получение данных из таблицы
        
        Args:
            sheet_name: Имя листа
            range: Диапазон ячеек
            
        Returns:
            Список строк с данными
        """
        if not self.service:
            return []
        
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=f'{sheet_name}!{range}'
            ).execute()
            
            return result.get('values', [])
        except Exception as e:
            print(f"Error getting values: {e}")
            return []
    
    def append_row(self, sheet_name: str, values: List[Any]) -> Dict:
        """
        Добавление строки в таблицу
        
        Args:
            sheet_name: Имя листа
            values: Значения для добавления
            
        Returns:
            Результат операции
        """
        if not self.service:
            return {}
        
        try:
            result = self.service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range=f'{sheet_name}!A:Z',
                valueInputOption='RAW',
                body={'values': [values]}
            ).execute()
            
            return result
        except Exception as e:
            print(f"Error appending row: {e}")
            return {}
    
    def update_row(self, sheet_name: str, row_index: int, values: List[Any]) -> Dict:
        """
        Обновление строки в таблице
        
        Args:
            sheet_name: Имя листа
            row_index: Индекс строки (0-based)
            values: Новые значения
            
        Returns:
            Результат операции
        """
        if not self.service:
            return {}
        
        try:
            # Google Sheets использует 1-based indexing
            range_name = f'{sheet_name}!A{row_index + 1}:Z{row_index + 1}'
            
            result = self.service.spreadsheets().values().update(
                spreadsheetId=self.spreadsheet_id,
                range=range_name,
                valueInputOption='RAW',
                body={'values': [values]}
            ).execute()
            
            return result
        except Exception as e:
            print(f"Error updating row: {e}")
            return {}
    
    def clear_row(self, sheet_name: str, row_index: int) -> Dict:
        """
        Очистка строки в таблице
        
        Args:
            sheet_name: Имя листа
            row_index: Индекс строки (0-based)
            
        Returns:
            Результат операции
        """
        if not self.service:
            return {}
        
        try:
            range_name = f'{sheet_name}!A{row_index + 1}:Z{row_index + 1}'
            
            result = self.service.spreadsheets().values().clear(
                spreadsheetId=self.spreadsheet_id,
                range=range_name,
                body={}
            ).execute()
            
            return result
        except Exception as e:
            print(f"Error clearing row: {e}")
            return {}
    
    def find_rows(self, sheet_name: str, column: str, value: str) -> List[Dict]:
        """
        Поиск строк по значению в колонке
        
        Args:
            sheet_name: Имя листа
            column: Имя колонки (заголовок)
            value: Искомое значение
            
        Returns:
            Список найденных строк как словари
        """
        data = self.get_values(sheet_name)
        if not data or len(data) < 2:
            return []
        
        headers = data[0]
        rows = data[1:]
        
        if column not in headers:
            return []
        
        column_index = headers.index(column)
        results = []
        
        for row in rows:
            if len(row) > column_index and row[column_index] == value:
                # Преобразуем строку в словарь
                row_dict = {}
                for i, header in enumerate(headers):
                    row_dict[header] = row[i] if i < len(row) else ''
                results.append(row_dict)
        
        return results
    
    def get_all_as_dicts(self, sheet_name: str) -> List[Dict]:
        """
        Получение всех данных как список словарей
        
        Args:
            sheet_name: Имя листа
            
        Returns:
            Список словарей, где ключи - заголовки колонок
        """
        data = self.get_values(sheet_name)
        if not data or len(data) < 2:
            return []
        
        headers = data[0]
        rows = data[1:]
        
        results = []
        for row in rows:
            row_dict = {}
            for i, header in enumerate(headers):
                row_dict[header] = row[i] if i < len(row) else ''
            results.append(row_dict)
        
        return results
    
    def create_record(self, sheet_name: str, data: Dict) -> Dict:
        """
        Создание записи в таблице
        
        Args:
            sheet_name: Имя листа
            data: Словарь с данными
            
        Returns:
            Результат операции
        """
        # Получаем заголовки
        all_data = self.get_values(sheet_name)
        if not all_data:
            # Если таблица пустая, создаём заголовки
            headers = list(data.keys())
            self.append_row(sheet_name, headers)
        
        headers = all_data[0]
        
        # Формируем строку значений в порядке заголовков
        values = []
        for header in headers:
            values.append(str(data.get(header, '')))
        
        # Добавляем новые колонки если их нет в заголовках
        for key in data.keys():
            if key not in headers:
                headers.append(key)
                values.append(str(data[key]))
        
        # Обновляем заголовки если добавили новые
        if len(values) > len(headers):
            self.update_row(sheet_name, 0, headers)
        
        return self.append_row(sheet_name, values)
    
    def update_record(self, sheet_name: str, search_column: str, search_value: str, data: Dict) -> Dict:
        """
        Обновление записи в таблице
        
        Args:
            sheet_name: Имя листа
            search_column: Колонка для поиска
            search_value: Искомое значение
            data: Новые данные
            
        Returns:
            Результат операции
        """
        rows = self.find_rows(sheet_name, search_column, search_value)
        if not rows:
            return {}
        
        # Получаем все данные для определения индекса строки
        all_data = self.get_values(sheet_name)
        headers = all_data[0]
        
        # Находим индекс строки
        row_index = all_data.index([search_value if h == search_column else r for h, r in zip(headers, all_data[1:])]) + 1
        
        # Формируем обновлённую строку
        current_row = rows[0]
        current_row.update(data)
        
        values = [current_row.get(h, '') for h in headers]
        
        return self.update_row(sheet_name, row_index - 1, values)
    
    def delete_record(self, sheet_name: str, search_column: str, search_value: str) -> Dict:
        """
        Удаление записи из таблицы
        
        Args:
            sheet_name: Имя листа
            search_column: Колонка для поиска
            search_value: Искомое значение
            
        Returns:
            Результат операции
        """
        rows = self.find_rows(sheet_name, search_column, search_value)
        if not rows:
            return {}
        
        # Находим индекс строки
        all_data = self.get_values(sheet_name)
        headers = all_data[0]
        
        for i, row in enumerate(all_data[1:], 1):
            if len(row) > headers.index(search_column) and row[headers.index(search_column)] == search_value:
                return self.clear_row(sheet_name, i)
        
        return {}


# Глобальный экземпляр для использования в боте
db: Optional[GoogleSheetsDB] = None


def init_database(credentials_json: str = None, spreadsheet_id: str = None):
    """
    Инициализация подключения к базе данных
    
    Args:
        credentials_json: JSON строка с credentials
        spreadsheet_id: ID Google Таблицы
    """
    global db
    db = GoogleSheetsDB(
        credentials_json=credentials_json,
        spreadsheet_id=spreadsheet_id
    )
    return db


def get_database() -> Optional[GoogleSheetsDB]:
    """Получение экземпляра базы данных"""
    return db
