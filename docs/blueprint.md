# **App Name**: Report Forge

## Core Features:

- Word Template Upload: Allows users to upload a Word document (.docx) as a template for report generation.
- Report Date Input: Provides a text input box for users to specify the report date (yyyy-mm). Uses the current month as the default value.
- Settings Management: Enables users to manage report parameters (parm_name) and their associated SQL queries stored in the SQLite database, including adding, editing, and deleting parameters.
- SQL Query Execution: Based on parameters identified within the template use a tool using generative AI to determine if information should be pulled. It will query the SQLite database using the corresponding SQL defined in the parm table for each parameter, and retrieve results for populating the report.
- Report Generation: Replaces placeholders in the Word template with data retrieved from the SQLite database and create a new file.
- Report Download: Provides a button for users to download the generated report as a Word document. The download button will be hidden by default and will show after generation is successful. File name combines the original template file name and the chosen parm_month
- Error Handling: Displays user-friendly error messages for any issues encountered during report generation, such as invalid SQL queries or missing parameters.

## Style Guidelines:

- Primary color: Slate blue (#708090) evoking professionalism and dependability.
- Background color: Light gray (#F0F8FF) for a clean and unobtrusive backdrop.
- Accent color: Soft Lavender (#E6E6FA) to add a touch of sophistication and highlight interactive elements.
- Body and headline font: 'Inter', a sans-serif font for a modern and clean aesthetic, for both headlines and body text.
- Use simple, outline-style icons for clarity and ease of understanding.
- Employ a clean, well-organized layout with sufficient spacing to improve readability.
- Subtle animations to highlight interactive elements, such as button hover effects and progress indicators during report generation.