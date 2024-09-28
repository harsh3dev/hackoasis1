import random
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains

chrome_options = Options()
chrome_options.add_argument("-incognito")
chrome_options.add_experimental_option("excludeSwitches", ['enable-automation'])

service = Service(executable_path=r'C:\Users\yaahg\chromedriver.exe')

browser = webdriver.Chrome(service=service, options=chrome_options)

actions = ActionChains(browser)




try:
    browser.get('http://localhost:3000/register') 

    def get_element(by, value):
        for _ in range(3): 
            try:
                return browser.find_element(by, value)
            except:
                time.sleep(1)  
        raise Exception(f"Element with {by}='{value}' not found")

    # Form Fields
    name_input = get_element(By.ID, 'name')
    email_input = get_element(By.ID, 'email')
    aadhaar_input = get_element(By.ID, 'aadhaar')
    eid_input = get_element(By.ID, 'eid')
    fathers_name_input = get_element(By.ID, 'fathers_name')
    phone_input = get_element(By.ID, 'phone')
    message_input = get_element(By.ID, 'message')
    submit_button = get_element(By.XPATH, '//button[@type="submit"]')


    name_input.send_keys('Bot Name')

    email_input.send_keys('bot@example.com')
    
    aadhaar_input.send_keys('12345678901234')
    
    eid_input.send_keys('123456789012')
    
    fathers_name_input.send_keys('Bot Father')
    
    phone_input.send_keys('9876543210')
    
    message_input.send_keys('This is a message from the bot.')
    
    submit_button.click()

    input("Press Enter to close the browser...")
    time.sleep(10)
finally:
    print("Bot has completed the form submission.")