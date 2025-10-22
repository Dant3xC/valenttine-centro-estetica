from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Navigate to a patient's history page (assuming patient with id 1 exists)
    page.goto("http://localhost:3000/historial/paciente/1")

    # Click the "Ver Historia Clínica Inicial" button
    page.click('a[href*="/ver-historia"]')

    # Wait for the page to load
    page.wait_for_load_state("networkidle")

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
