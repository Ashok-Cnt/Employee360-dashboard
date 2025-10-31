const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType } = require('docx');
const path = require('path');
const fs = require('fs').promises;

/**
 * Generate Excel Report
 */
router.post('/generate/excel', async (req, res) => {
  try {
    const { learningData } = req.body;
    
    if (!learningData) {
      return res.status(400).json({ error: 'Learning data is required' });
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Employee360 Dashboard';
    workbook.created = new Date();

    // Sheet 1: Today's Learning
    const todaySheet = workbook.addWorksheet('Today\'s Learning', {
      properties: { tabColor: { argb: '667eea' } }
    });
    
    todaySheet.columns = [
      { header: 'Course Name', key: 'courseName', width: 40 },
      { header: 'Completed Lessons', key: 'completedLessons', width: 20 },
      { header: 'Total Lessons', key: 'totalLessons', width: 20 },
      { header: 'Progress %', key: 'percentComplete', width: 15 },
    ];

    // Style header row
    todaySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    todaySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '667eea' }
    };

    // Add today's data
    if (learningData.todayData && learningData.todayData.courses) {
      learningData.todayData.courses.forEach(course => {
        todaySheet.addRow({
          courseName: course.courseName,
          completedLessons: course.stats.completedLessons || 0,
          totalLessons: course.stats.totalLessons || 0,
          percentComplete: course.stats.percentComplete || 0
        });
      });
    }

    // Sheet 2: All Courses
    const allCoursesSheet = workbook.addWorksheet('All Courses', {
      properties: { tabColor: { argb: '764ba2' } }
    });
    
    allCoursesSheet.columns = [
      { header: 'Course Name', key: 'courseName', width: 40 },
      { header: 'Progress %', key: 'percentComplete', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    // Style header row
    allCoursesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    allCoursesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '764ba2' }
    };

    // Add all courses data
    if (learningData.allCourses && learningData.allCourses.courses) {
      learningData.allCourses.courses.forEach(course => {
        const progress = course.stats.percentComplete || 0;
        allCoursesSheet.addRow({
          courseName: course.courseName,
          percentComplete: progress,
          status: progress >= 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'
        });
      });
    }

    // Sheet 3: Statistics
    const statsSheet = workbook.addWorksheet('Statistics');
    
    statsSheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];

    // Style header row
    statsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    statsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2196f3' }
    };

    // Add statistics
    if (learningData.stats) {
      statsSheet.addRow({ metric: 'Total Courses', value: learningData.stats.totalCourses || 0 });
      statsSheet.addRow({ metric: 'Completed Courses', value: learningData.stats.completedCourses || 0 });
      statsSheet.addRow({ metric: 'Active Learning Days', value: learningData.stats.totalDaysWithLearning || 0 });
      statsSheet.addRow({ metric: 'Average Progress', value: learningData.stats.averageProgress ? `${learningData.stats.averageProgress}%` : '0%' });
    }

    // Sheet 4: Goals
    const goalsSheet = workbook.addWorksheet('Learning Goals');
    
    goalsSheet.columns = [
      { header: 'Goal', key: 'goal', width: 50 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Progress %', key: 'progress', width: 15 },
    ];

    // Style header row
    goalsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    goalsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4caf50' }
    };

    // Add goals
    if (learningData.goals && learningData.goals.length > 0) {
      learningData.goals.forEach(goal => {
        goalsSheet.addRow({
          goal: goal.goalText,
          status: goal.status || 'active',
          progress: goal.progress != null ? goal.progress : 0
        });
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=learning-progress-${Date.now()}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error('Error generating Excel report:', error);
    res.status(500).json({ error: 'Failed to generate Excel report', message: error.message });
  }
});

/**
 * Generate Word Report
 */
router.post('/generate/word', async (req, res) => {
  try {
    const { learningData } = req.body;
    
    if (!learningData) {
      return res.status(400).json({ error: 'Learning data is required' });
    }

    const sections = [];

    // Title
    sections.push(
      new Paragraph({
        text: 'Learning Progress Report',
        heading: 'Heading1',
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    sections.push(
      new Paragraph({
        text: `Generated on: ${new Date().toLocaleDateString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Today's Learning Section
    sections.push(
      new Paragraph({
        text: 'Today\'s Learning',
        heading: 'Heading2',
        spacing: { before: 400, after: 200 }
      })
    );

    if (learningData.todayData && learningData.todayData.courses && learningData.todayData.courses.length > 0) {
      const todayRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: 'Course Name', bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: 'Completed', bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: 'Total', bold: true })] }),
            new TableCell({ children: [new Paragraph({ text: 'Progress', bold: true })] }),
          ]
        })
      ];

      learningData.todayData.courses.forEach(course => {
        todayRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(course.courseName)] }),
              new TableCell({ children: [new Paragraph(String(course.stats.completedLessons || 0))] }),
              new TableCell({ children: [new Paragraph(String(course.stats.totalLessons || 0))] }),
              new TableCell({ children: [new Paragraph(`${course.stats.percentComplete || 0}%`)] }),
            ]
          })
        );
      });

      sections.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: todayRows
        })
      );
    } else {
      sections.push(new Paragraph('No courses studied today.'));
    }

    // Statistics Section
    sections.push(
      new Paragraph({
        text: 'Overall Statistics',
        heading: 'Heading2',
        spacing: { before: 400, after: 200 }
      })
    );

    if (learningData.stats) {
      sections.push(new Paragraph(`Total Courses: ${learningData.stats.totalCourses || 0}`));
      sections.push(new Paragraph(`Completed Courses: ${learningData.stats.completedCourses || 0}`));
      sections.push(new Paragraph(`Active Learning Days: ${learningData.stats.totalDaysWithLearning || 0}`));
    }

    // Goals Section
    sections.push(
      new Paragraph({
        text: 'Learning Goals',
        heading: 'Heading2',
        spacing: { before: 400, after: 200 }
      })
    );

    if (learningData.goals && learningData.goals.length > 0) {
      learningData.goals.forEach((goal, index) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. `, bold: true }),
              new TextRun(goal.goalText),
              new TextRun({ text: ` (${goal.status || 'active'})`, italics: true })
            ]
          })
        );
      });
    } else {
      sections.push(new Paragraph('No learning goals set.'));
    }

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: sections
      }]
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);
    
    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=learning-progress-${Date.now()}.docx`);
    res.send(buffer);

  } catch (error) {
    console.error('Error generating Word report:', error);
    res.status(500).json({ error: 'Failed to generate Word report', message: error.message });
  }
});

/**
 * Generate PDF Report
 */
router.post('/generate/pdf', async (req, res) => {
  try {
    const { learningData } = req.body;
    
    if (!learningData) {
      return res.status(400).json({ error: 'Learning data is required' });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=learning-progress-${Date.now()}.pdf`);
    
    // Pipe the PDF document to response
    doc.pipe(res);

    // Helper function to draw a line
    const drawLine = (y) => {
      doc.moveTo(50, y).lineTo(550, y).stroke();
    };

    // Title
    doc.fontSize(24).fillColor('#667eea').text('Learning Progress Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#666').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);

    // Today's Learning Section
    doc.fontSize(18).fillColor('#000').text('Today\'s Learning', { underline: true });
    doc.moveDown(0.5);

    if (learningData.todayData && learningData.todayData.courses && learningData.todayData.courses.length > 0) {
      learningData.todayData.courses.forEach((course, index) => {
        doc.fontSize(12).fillColor('#333');
        doc.text(`${index + 1}. ${course.courseName}`, { indent: 20 });
        doc.fontSize(10).fillColor('#666');
        doc.text(`   Lessons: ${course.stats.completedLessons || 0}/${course.stats.totalLessons || 0} (${course.stats.percentComplete || 0}% complete)`, { indent: 20 });
        doc.moveDown(0.5);
      });
    } else {
      doc.fontSize(12).fillColor('#999').text('No courses studied today.', { indent: 20 });
    }
    
    doc.moveDown(1);

    // Statistics Section
    doc.fontSize(18).fillColor('#000').text('Overall Statistics', { underline: true });
    doc.moveDown(0.5);

    if (learningData.stats) {
      doc.fontSize(12).fillColor('#333');
      doc.text(`Total Courses: ${learningData.stats.totalCourses || 0}`, { indent: 20 });
      doc.text(`Completed Courses: ${learningData.stats.completedCourses || 0}`, { indent: 20 });
      doc.text(`Active Learning Days: ${learningData.stats.totalDaysWithLearning || 0}`, { indent: 20 });
      
      if (learningData.stats.topCourses && learningData.stats.topCourses.length > 0) {
        doc.moveDown(0.5);
        doc.text('Top Courses:', { indent: 20 });
        learningData.stats.topCourses.slice(0, 3).forEach((course, index) => {
          doc.fontSize(10).fillColor('#666');
          doc.text(`${index + 1}. ${course.courseName} (${course.maxProgress}% complete)`, { indent: 40 });
        });
      }
    }
    
    doc.moveDown(1);

    // All Courses Section
    if (learningData.allCourses && learningData.allCourses.courses && learningData.allCourses.courses.length > 0) {
      doc.fontSize(18).fillColor('#000').text('All Courses', { underline: true });
      doc.moveDown(0.5);
      
      learningData.allCourses.courses.slice(0, 10).forEach((course, index) => {
        doc.fontSize(11).fillColor('#333');
        doc.text(`${index + 1}. ${course.courseName}`, { indent: 20 });
        doc.fontSize(10).fillColor('#666');
        doc.text(`   Progress: ${course.stats.percentComplete || 0}%`, { indent: 20 });
        doc.moveDown(0.3);
      });
      
      if (learningData.allCourses.courses.length > 10) {
        doc.fontSize(10).fillColor('#999').text(`... and ${learningData.allCourses.courses.length - 10} more courses`, { indent: 20 });
      }
      
      doc.moveDown(1);
    }

    // Goals Section
    doc.fontSize(18).fillColor('#000').text('Learning Goals', { underline: true });
    doc.moveDown(0.5);

    if (learningData.goals && learningData.goals.length > 0) {
      learningData.goals.forEach((goal, index) => {
        doc.fontSize(12).fillColor('#333');
        doc.text(`${index + 1}. ${goal.goalText}`, { indent: 20 });
        doc.fontSize(10).fillColor('#666');
        doc.text(`   Status: ${goal.status || 'active'} ${goal.progress != null ? `(${goal.progress}% progress)` : ''}`, { indent: 20 });
        doc.moveDown(0.5);
      });
    } else {
      doc.fontSize(12).fillColor('#999').text('No learning goals set.', { indent: 20 });
    }

    // Footer
    doc.moveDown(2);
    const bottomY = doc.page.height - 100;
    doc.fontSize(10).fillColor('#999').text(
      'Generated by Employee360 Dashboard',
      50,
      bottomY,
      { align: 'center' }
    );

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('Error generating PDF report:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF report', message: error.message });
    }
  }
});

module.exports = router;
