# AI Rules for Lovable Project

This document outlines the core technologies used in this project and provides guidelines for using specific libraries and frameworks.

## Tech Stack

*   **Vite**: A fast build tool that provides an instant development server and optimized builds.
*   **TypeScript**: The primary programming language, ensuring type safety and improving code maintainability.
*   **React**: The JavaScript library for building user interfaces, focusing on component-based development.
*   **shadcn/ui**: A collection of reusable components built with Radix UI and styled with Tailwind CSS, providing a consistent and modern UI.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs directly in your markup.
*   **React Router**: Used for declarative routing within the application, managing navigation between different pages.
*   **Supabase**: Our backend-as-a-service, handling authentication, database operations, and real-time functionalities.
*   **Tanstack Query (React Query)**: For efficient data fetching, caching, and synchronization with the server.
*   **Recharts**: A charting library for building responsive and customizable data visualizations.
*   **Lucide React**: A library providing a set of beautiful and customizable SVG icons.
*   **Next Themes**: For managing light and dark mode themes across the application.
*   **React Hook Form & Zod**: For robust form management and schema-based validation.
*   **html2canvas & jspdf**: For client-side PDF generation from HTML elements.
*   **Sonner**: For displaying elegant and accessible toast notifications.

## Library Usage Rules

To maintain consistency and leverage the strengths of our chosen tech stack, please adhere to the following guidelines:

*   **UI Components**: Always prioritize `shadcn/ui` components for building the user interface. If a specific component is not available or requires significant customization, create a new component in `src/components/` and style it using Tailwind CSS. **Do not modify files within `src/components/ui` directly.**
*   **Styling**: All styling must be done using **Tailwind CSS** utility classes. Avoid writing custom CSS in separate files or using inline styles, except for global styles defined in `src/index.css`.
*   **State Management**:
    *   For local component state, use React's `useState` and `useReducer` hooks.
    *   For global application state, especially authentication, utilize the existing `AuthContext`.
    *   For server state (data fetching, caching, and synchronization), use **Tanstack Query (React Query)**.
*   **Routing**: Use **React Router** for all client-side navigation and route definitions. Routes should primarily be managed in `src/App.tsx`.
*   **Icons**: Use icons from the **lucide-react** library.
*   **Forms & Validation**: For all forms, use **React Hook Form** for form management and **Zod** for schema validation. Integrate these with `shadcn/ui` form components.
*   **Backend, Database & Authentication**: All interactions with the backend, including user authentication, database queries, and real-time features, must be handled through the **Supabase** client (`@/integrations/supabase/client`).
*   **Charts**: For any data visualization requirements, use **Recharts**.
*   **Theming**: Implement dark/light mode functionality using **next-themes**.
*   **Notifications**: For displaying user feedback or alerts, use **Sonner** for toast notifications.
*   **PDF Generation**: When generating PDFs from existing HTML content, use **html2canvas** to capture the DOM and **jspdf** to create and save the PDF document.