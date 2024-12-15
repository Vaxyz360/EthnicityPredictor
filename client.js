document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('name');
    const errorDiv = document.createElement('div');
    errorDiv.style.color = 'red';
    nameInput.parentNode.insertBefore(errorDiv, nameInput.nextSibling);

    //Predict Ethnicity Button
    document.getElementById('predictEthnicity').addEventListener('click', async () => {
        const name = nameInput.value;
        if (!name) {
            errorDiv.textContent = 'Name is required.';
            return;
        } else {
            errorDiv.textContent = '';
        }
        try {
            const response = await fetch(`/search?name=${encodeURIComponent(name)}`);
            if (response.status === 429) {
                alert('API has received too many requests in a short time');
                return;
            }
            const data = await response.json();
            if (!data.country) {
                errorDiv.textContent = 'No ethnicity data available. Too many requests in a short time';
                return;
            }
            const resultsDiv = document.getElementById('ethnicityResults');
            resultsDiv.innerHTML = `<h2>These countries may be ${data.name}'s ethnicity:</h2>`;
            let tableContent = `<table><thead><tr><th>Country Abbreviation</th><th>Probability (%)</th></tr></thead><tbody>`;
            data.country.forEach(country => {
                tableContent += `<tr><td>${country.country_id}</td><td>${(country.probability * 100).toFixed(2)}</td></tr>`;
            });
            tableContent += `</tbody></table>`;
            resultsDiv.innerHTML += tableContent;
        } catch (error) {
            console.error('Error fetching ethnicity data:', error);
        }
    });

    //Submit Form Button
    document.getElementById('submitForm').addEventListener('click', async (event) => {
        event.preventDefault();
        const name = nameInput.value;
        if (!name) {
            errorDiv.textContent = 'Name is required.';
            return;
        } else {
            errorDiv.textContent = '';
        }
        const coolness = document.getElementById('coolness').value;
        const accuracy = document.getElementById('accuracy').value;

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, coolness, accuracy })
            });
            if (response.ok) {
                alert('Form Submitted');
                console.log('Form data submitted successfully');
            } else {
                console.error('Failed to submit form:', response.statusText);
            }
        } catch (error) {
            console.error('Error submitting form data:', error);
        }
    });

    //Clear Entries Button
    document.getElementById('clearEntries').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete all entries?')) {
            try {
                const response = await fetch('/api/clear', {
                    method: 'DELETE'
                });
                if (response.ok) {
                    alert('All entries cleared successfully');
                    console.log('All entries cleared');
                } else {
                    console.error('Failed to clear entries:', response.statusText);
                }
            } catch (error) {
                console.error('Error clearing entries:', error);
            }
        }
    });
});
