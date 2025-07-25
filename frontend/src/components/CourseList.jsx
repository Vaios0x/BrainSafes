import React from 'react';
import CourseCard from './CourseCard';

export default function CourseList({ courses }) {
  return (
    <section style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </section>
  );
} 