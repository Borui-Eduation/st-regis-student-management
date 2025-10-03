/**
 * Custom Hook: useAdminData
 * 管理管理员页面的数据获取逻辑
 */

import { useState, useEffect, useCallback } from 'react';
import type { Student, Enrollment, Stats, FilterStatus } from '../types';

interface UseAdminDataProps {
  activeTab: 'students' | 'enrollments';
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  filterStatus: FilterStatus;
}

export function useAdminData({ 
  activeTab, 
  currentPage, 
  pageSize, 
  searchTerm, 
  filterStatus 
}: UseAdminDataProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);

  // 获取教师和课程列表
  const fetchTeachersAndCourses = useCallback(async () => {
    try {
      const [teachersRes, coursesRes] = await Promise.all([
        fetch('/api/admin/teachers'),
        fetch('/api/admin/courses/list'),
      ]);

      const [teachersData, coursesData] = await Promise.all([
        teachersRes.json(),
        coursesRes.json(),
      ]);

      if (teachersData.success) setTeachers(teachersData.data);
      if (coursesData.success) setCourses(coursesData.data);
    } catch (error) {
      console.error('Failed to fetch teachers/courses:', error);
    }
  }, []);

  // 获取主数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 获取统计数据
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.data);
      }

      if (activeTab === 'students') {
        // 获取学生列表
        if (filterStatus === 'all') {
          const studentsRes = await fetch(
            `/api/admin/students?page=${currentPage}&pageSize=${pageSize}&search=${encodeURIComponent(searchTerm)}`
          );
          const studentsData = await studentsRes.json();
          if (studentsData.success) {
            setStudents(studentsData.data.items);
            setTotalPages(Math.ceil(studentsData.data.total / pageSize));
          }
        } else {
          // 按状态筛选学生
          const studentsRes = await fetch(`/api/admin/students/by-status?status=${filterStatus}`);
          const studentsData = await studentsRes.json();
          if (studentsData.success) {
            setStudents(studentsData.data.students);
            setTotalPages(1); // 状态筛选不分页
          }
        }
      } else {
        // 获取待审批列表
        const enrollmentsRes = await fetch('/api/admin/enrollments/pending');
        const enrollmentsData = await enrollmentsRes.json();
        if (enrollmentsData.success) {
          setEnrollments(enrollmentsData.data.items);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, pageSize, searchTerm, filterStatus]);

  // 初始化数据
  useEffect(() => {
    fetchData();
    fetchTeachersAndCourses();
  }, [fetchData, fetchTeachersAndCourses]);

  return {
    students,
    enrollments,
    stats,
    loading,
    totalPages,
    teachers,
    courses,
    refetch: fetchData,
  };
}



