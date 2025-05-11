/**
 * Export module for WineRater
 * Handles exporting wine collection data in various formats (CSV, PDF)
 * Works with both local storage and Firebase cloud storage
 */

const ExportModule = {
    // Initialize the export module
    init: function() {
        // Set up event listeners
        this.setupEventListeners();
    },
    
    // Set up event listeners for export functionality
    setupEventListeners: function() {
        const exportCSVBtn = document.getElementById('export-csv-btn');
        if (exportCSVBtn) {
            exportCSVBtn.addEventListener('click', () => {
                this.exportToCSV();
            });
        }
        
        const exportPDFBtn = document.getElementById('export-pdf-btn');
        if (exportPDFBtn) {
            exportPDFBtn.addEventListener('click', () => {
                this.exportToPDF();
            });
        }
    },
    
    // Export wines data to CSV format
    exportToCSV: function() {
        // Get wine data
        const wines = WineRater.data.wines;
        
        if (wines.length === 0) {
            WineRater.showToast('No wines to export', 'warning');
            return;
        }
        
        // Define CSV headers
        const headers = [
            'Name',
            'Winery',
            'Vintage',
            'Type',
            'Varietal',
            'Region',
            'Country',
            'Price',
            'Overall Rating',
            'Aroma Rating',
            'Taste Rating',
            'Body Rating',
            'Finish Rating',
            'Value Rating',
            'Notes',
            'Date Added'
        ];
        
        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        
        // Add wine data rows
        wines.forEach(wine => {
            // Format date
            const dateAdded = new Date(wine.dateAdded).toLocaleDateString();
            
            // Create row with proper escaping for CSV
            const row = [
                this.escapeCSV(wine.name),
                this.escapeCSV(wine.winery),
                this.escapeCSV(wine.vintage),
                this.escapeCSV(wine.type),
                this.escapeCSV(wine.varietal),
                this.escapeCSV(wine.region),
                this.escapeCSV(wine.country),
                this.escapeCSV(wine.price),
                this.escapeCSV(wine.overallRating.toFixed(1)),
                this.escapeCSV(wine.ratings.aroma),
                this.escapeCSV(wine.ratings.taste),
                this.escapeCSV(wine.ratings.body),
                this.escapeCSV(wine.ratings.finish),
                this.escapeCSV(wine.ratings.value),
                this.escapeCSV(wine.notes),
                this.escapeCSV(dateAdded)
            ];
            
            csvContent += row.join(',') + '\n';
        });
        
        // Create download link
        const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'wine-collection.csv');
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        WineRater.showToast('CSV export successful!', 'success');
    },
    
    // Helper function to escape CSV values
    escapeCSV: function(value) {
        if (value === null || value === undefined) {
            return '';
        }
        
        value = String(value);
        
        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            // Replace double quotes with two double quotes
            value = value.replace(/"/g, '""');
            // Wrap with quotes
            value = '"' + value + '"';
        }
        
        return value;
    },
    
    // Export wines data to PDF format
    exportToPDF: function() {
        // Get wine data
        const wines = WineRater.data.wines;
        
        if (wines.length === 0) {
            WineRater.showToast('No wines to export', 'warning');
            return;
        }
        
        // Load jsPDF library dynamically if not already loaded
        if (typeof jsPDF === 'undefined') {
            // Create a script element to load jsPDF
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                // Once loaded, load jspdf-autotable plugin
                const autoTableScript = document.createElement('script');
                autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js';
                autoTableScript.onload = () => {
                    // Once both are loaded, generate the PDF
                    this.generatePDF(wines);
                };
                document.head.appendChild(autoTableScript);
            };
            document.head.appendChild(script);
        } else {
            // If already loaded, generate PDF directly
            this.generatePDF(wines);
        }
    },
    
    // Generate PDF with wine data
    generatePDF: function(wines) {
        // Create new jsPDF instance
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Wine Collection', 14, 20);
        
        // Add export date
        doc.setFontSize(10);
        doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 30);
        
        // Add total count
        doc.text(`Total wines: ${wines.length}`, 14, 35);
        
        // Define table columns
        const columns = [
            { header: 'Name', dataKey: 'name' },
            { header: 'Winery', dataKey: 'winery' },
            { header: 'Vintage', dataKey: 'vintage' },
            { header: 'Type', dataKey: 'type' },
            { header: 'Varietal', dataKey: 'varietal' },
            { header: 'Rating', dataKey: 'rating' }
        ];
        
        // Prepare table data
        const rows = wines.map(wine => ({
            name: wine.name,
            winery: wine.winery,
            vintage: wine.vintage,
            type: wine.type,
            varietal: wine.varietal,
            rating: wine.overallRating.toFixed(1)
        }));
        
        // Create table
        doc.autoTable({
            head: [columns.map(col => col.header)],
            body: rows.map(row => columns.map(col => row[col.dataKey])),
            startY: 40,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [128, 0, 32] }
        });
        
        // For each wine, add a detailed page
        wines.forEach((wine, index) => {
            // Add a new page for each wine
            doc.addPage();
            
            // Add wine name as title
            doc.setFontSize(16);
            doc.text(`${wine.name} (${wine.vintage})`, 14, 20);
            
            // Add wine details
            doc.setFontSize(12);
            doc.text(`Winery: ${wine.winery}`, 14, 30);
            doc.text(`Type: ${wine.type}`, 14, 35);
            doc.text(`Varietal: ${wine.varietal}`, 14, 40);
            doc.text(`Region: ${wine.region}, ${wine.country}`, 14, 45);
            doc.text(`Price: $${parseFloat(wine.price).toFixed(2)}`, 14, 50);
            
            // Add ratings
            doc.setFontSize(14);
            doc.text('Ratings', 14, 60);
            
            doc.setFontSize(10);
            doc.text(`Overall: ${wine.overallRating.toFixed(1)}/5`, 14, 70);
            doc.text(`Aroma: ${wine.ratings.aroma}/5`, 14, 75);
            doc.text(`Taste: ${wine.ratings.taste}/5`, 14, 80);
            doc.text(`Body: ${wine.ratings.body}/5`, 14, 85);
            doc.text(`Finish: ${wine.ratings.finish}/5`, 14, 90);
            doc.text(`Value: ${wine.ratings.value}/5`, 14, 95);
            
            // Add tasting notes
            doc.setFontSize(14);
            doc.text('Tasting Notes', 14, 105);
            
            doc.setFontSize(10);
            const noteLines = doc.splitTextToSize(wine.notes || 'No tasting notes provided.', 180);
            doc.text(noteLines, 14, 115);
            
            // Add wine image if available
            if (wine.imageData) {
                try {
                    doc.addImage(wine.imageData, 'JPEG', 120, 30, 70, 70);
                } catch (e) {
                    console.error('Error adding image to PDF:', e);
                    // Continue without image if there's an error
                }
            }
        });
        
        // Save the PDF
        doc.save('wine-collection.pdf');
        
        // Show success message
        WineRater.showToast('PDF export successful!', 'success');
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    ExportModule.init();
});