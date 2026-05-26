import { useState, useEffect } from "react";

/**
 * Hook to track the active section on a page using IntersectionObserver.
 * 
 * @param sectionIds Array of section element IDs to watch.
 * @param options IntersectionObserver options.
 * @returns The ID of the currently active section.
 */
export function useActiveSection(
  sectionIds: string[],
  options: IntersectionObserverInit = { threshold: 0.5, rootMargin: "-10% 0px -70% 0px" }
) {
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, options);

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      sectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [sectionIds, options]);

  return activeSection;
}
