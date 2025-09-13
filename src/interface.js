// Global state
let currentSequences = [];
let selectedSequence = null;
let lastGeneratedOutline = null;
let availableModels = [];
let selectedModelId = null;

// Helper function to get auth headers
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa('admin:ILikeSmut')
    };
}

// Load models from server API
async function loadModels() {
    try {
        const baseUrl = document.getElementById('apiBaseUrl').value;
        const response = await fetch(`${baseUrl}/test/api/models`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        availableModels = result.models || [];
        populateModelSelect();

    } catch (error) {
        showError('Failed to load models: ' + error.message);
        // Set empty option if failed
        const select = document.getElementById('modelSelect');
        select.innerHTML = '<option value="">Failed to load models</option>';
    }
}

// Populate model dropdown
function populateModelSelect() {
    const select = document.getElementById('modelSelect');
    select.innerHTML = '<option value="">Select a model (optional)...</option>';

    availableModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.display_name;
        select.appendChild(option);
    });

    // Select first model by default if available
    if (availableModels.length > 0) {
        select.value = availableModels[0].id;
        selectedModelId = availableModels[0].id;
    }
}

// Handle model selection change
function handleModelChange() {
    selectedModelId = document.getElementById('modelSelect').value;
}

// Load sequences from server API instead of direct Supabase access
async function loadSequences() {
    try {
        showLoading('plotPointLoading');

        const baseUrl = document.getElementById('apiBaseUrl').value;
        const response = await fetch(`${baseUrl}/test/api/sequences`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        currentSequences = result.sequences || [];
        populateSequenceSelect();

    } catch (error) {
        showError('Failed to load sequences: ' + error.message);
    } finally {
        hideLoading('plotPointLoading');
    }
}

// Utility functions
function showLoading(elementId) {
    document.getElementById(elementId).style.display = 'flex';
}

function hideLoading(elementId) {
    document.getElementById(elementId).style.display = 'none';
}

function showResults(elementId, content, isError = false) {
    const element = document.getElementById(elementId);
    element.textContent = content;
    element.className = `results ${isError ? 'error' : 'success'}`;
    element.classList.remove('hidden');
}

function showError(message) {
    alert('Error: ' + message);
}

// API call functions
async function makeApiCall(endpoint, method = 'GET', data = null) {
    const baseUrl = document.getElementById('apiBaseUrl').value;
    if (!baseUrl) {
        throw new Error('API Base URL is required');
    }
    
    const url = `${baseUrl}${endpoint}`;
    
    const options = {
        method,
        headers: getAuthHeaders(),
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();
    
    if (!response.ok) {
        if (result.error) {
            throw new Error(result.error);
        }
        throw new Error(`API call failed with status: ${response.status}`);
    }
    
    return result;
}

function populateSequenceSelect() {
    const select = document.getElementById('sequenceSelect');
    select.innerHTML = '<option value="">Select a sequence...</option>';
    
    currentSequences.forEach(sequence => {
        const option = document.createElement('option');
        option.value = sequence.id;
        option.textContent = `${sequence.name}${sequence.description ? ' - ' + sequence.description.substring(0, 50) + '...' : ''}`;
        select.appendChild(option);
    });
}

// Handle sequence selection
function handleSequenceChange() {
    const sequenceId = document.getElementById('sequenceSelect').value;
    selectedSequence = currentSequences.find(s => s.id === sequenceId);
    
    if (selectedSequence) {
        displaySequenceOutline();
        populateChapterSelect();
        document.getElementById('chapterSelect').disabled = false;
    } else {
        document.getElementById('sequenceOutline').textContent = 'Select a sequence to view its outline...';
        document.getElementById('chapterSelect').disabled = true;
        document.getElementById('plotPointSelect').disabled = true;
        document.getElementById('generatePlotPointBtn').disabled = true;
    }
}

function displaySequenceOutline() {
    if (!selectedSequence || !selectedSequence.chapters) {
        document.getElementById('sequenceOutline').textContent = 'No outline available for this sequence.';
        return;
    }

    let outline = '';
    try {
        const chapters = Array.isArray(selectedSequence.chapters) ? selectedSequence.chapters : [];
        
        chapters.forEach((chapter, index) => {
            const chapterName = chapter.name ? chapter.name : 'Untitled';
            outline += `<div class="chapter-title">Chapter ${index + 1}: ${chapterName}</div>\n`;
            if (chapter.plotPoints && Array.isArray(chapter.plotPoints)) {
                chapter.plotPoints.forEach(plotPoint => {
                    outline += `<div class="plot-point">- ${plotPoint}</div>\n`;
                });
            }
            outline += '\n';
        });
        
        if (outline) {
            document.getElementById('sequenceOutline').innerHTML = outline;
        } else {
            document.getElementById('sequenceOutline').textContent = 'No chapters found.';
        }
    } catch (error) {
        document.getElementById('sequenceOutline').textContent = 'Error displaying outline: ' + error.message;
    }
}

function populateChapterSelect() {
    const select = document.getElementById('chapterSelect');
    select.innerHTML = '<option value="">Select a chapter...</option>';
    
    if (selectedSequence && selectedSequence.chapters) {
        try {
            const chapters = Array.isArray(selectedSequence.chapters) ? selectedSequence.chapters : [];
            chapters.forEach((chapter, index) => {
                const option = document.createElement('option');
                option.value = index;
                const chapterName = chapter.name ? chapter.name : 'Untitled';
                option.textContent = `Chapter ${index + 1}: ${chapterName}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error populating chapters:', error);
        }
    }
}

function handleChapterChange() {
    const chapterIndex = document.getElementById('chapterSelect').value;
    
    if (chapterIndex !== '' && selectedSequence && selectedSequence.chapters) {
        populatePlotPointSelect(parseInt(chapterIndex));
        document.getElementById('plotPointSelect').disabled = false;
        document.getElementById('generatePlotPointBtn').disabled = false;
    } else {
        document.getElementById('plotPointSelect').disabled = true;
        document.getElementById('generatePlotPointBtn').disabled = true;
    }
}

function populatePlotPointSelect(chapterIndex) {
    const select = document.getElementById('plotPointSelect');
    select.innerHTML = '<option value="full">Generate Full Chapter</option>';
    
    try {
        const chapter = selectedSequence.chapters[chapterIndex];
        if (chapter && chapter.plotPoints && Array.isArray(chapter.plotPoints)) {
            chapter.plotPoints.forEach((plotPoint, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `Plot Point ${index + 1}: ${plotPoint.substring(0, 50)}${plotPoint.length > 50 ? '...' : ''}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error populating plot points:', error);
    }
}

async function generateComponent(componentType) {
    const outline = document.getElementById('componentOutline').value;
    if (!outline) {
        showResults('componentResults', 'Please enter an outline first', true);
        return;
    }

    try {
        showLoading('componentLoading');
        
        const baseUrl = document.getElementById('apiBaseUrl').value;
        const response = await fetch(`${baseUrl}/test/api/generate-${componentType}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ outline, model_id: selectedModelId })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Format component results
        let formattedOutput = `Generated ${componentType.replace('-', ' ').toUpperCase()}:\n\n`;
        formattedOutput += JSON.stringify(result.data || result, null, 2);
        showResults('componentResults', formattedOutput);

    } catch (error) {
        showResults('componentResults', `Error: ${error.message}`, true);
    } finally {
        hideLoading('componentLoading');
    }
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set default values
    const apiBaseUrlInput = document.getElementById('apiBaseUrl');
    if (!apiBaseUrlInput.value) {
        apiBaseUrlInput.value = 'http://localhost:3951';
    }

    // Load models and sequences on page load
    loadModels();
    loadSequences();

    // Add model selection event listener
    document.getElementById('modelSelect').addEventListener('change', handleModelChange);

    // Handle quirks form submission
    document.getElementById('quirksForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            author_style: parseInt(document.getElementById('quirksAuthorStyle').value),
            spice_level: parseInt(document.getElementById('quirksSpiceLevel').value),
            story_description: document.getElementById('quirksStoryDescription').value,
            model_id: selectedModelId
        };

        try {
            showLoading('quirksLoading');
            document.querySelector('#quirksForm button').disabled = true;
            
            const baseUrl = document.getElementById('apiBaseUrl').value;
            const response = await fetch(`${baseUrl}/test/api/generate-quirks`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Format quirks nicely
            if (result.quirks && Array.isArray(result.quirks)) {
                let formattedOutput = "Generated Writing Quirks:\n\n";
                result.quirks.forEach((quirk, index) => {
                    formattedOutput += `${index + 1}. ${quirk}\n`;
                });
                showResults('quirksResults', formattedOutput);
            } else {
                showResults('quirksResults', JSON.stringify(result, null, 2));
            }

        } catch (error) {
            showResults('quirksResults', `Error: ${error.message}`, true);
        } finally {
            hideLoading('quirksLoading');
            document.querySelector('#quirksForm button').disabled = false;
        }
    });

    // Handle metadata form submission
    document.getElementById('metadataForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const outlineText = document.getElementById('metadataOutline').value;
        const formData = {
            outline: outlineText,
            story_length: parseInt(document.getElementById('metadataStoryLength').value),
            model_id: selectedModelId
        };

        try {
            showLoading('metadataLoading');
            document.querySelector('#metadataForm button').disabled = true;
            
            const baseUrl = document.getElementById('apiBaseUrl').value;
            const response = await fetch(`${baseUrl}/test/api/generate-metadata`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Format metadata nicely
            if (result.success && result.metadata) {
                const meta = result.metadata;
                let formattedOutput = "Generated Metadata:\n\n";
                formattedOutput += `📚 Title: ${meta.title}\n\n`;
                formattedOutput += `📝 Description: ${meta.description}\n\n`;
                formattedOutput += `🏷️ Tags: ${meta.tags.join(', ')}\n\n`;
                formattedOutput += `⚠️ Trigger Warnings: ${meta.trigger_warnings.length > 0 ? meta.trigger_warnings.join(', ') : 'None'}\n\n`;
                formattedOutput += `🔞 Sexually Explicit: ${meta.is_sexually_explicit ? 'Yes' : 'No'}\n\n`;
                formattedOutput += `🎯 Target Audience: ${meta.target_audience.join(', ')}`;
                showResults('metadataResults', formattedOutput);
            } else {
                showResults('metadataResults', JSON.stringify(result, null, 2));
            }

        } catch (error) {
            showResults('metadataResults', `Error: ${error.message}`, true);
        } finally {
            hideLoading('metadataLoading');
            document.querySelector('#metadataForm button').disabled = false;
        }
    });

    // Handle individual component buttons
    document.getElementById('generateTitleDescBtn').addEventListener('click', async function() {
        await generateComponent('title-description');
    });
    
    document.getElementById('generateTagsBtn').addEventListener('click', async function() {
        await generateComponent('tags');
    });
    
    document.getElementById('generateWarningsBtn').addEventListener('click', async function() {
        await generateComponent('trigger-warnings');
    });
    
    document.getElementById('generateAudienceBtn').addEventListener('click', async function() {
        await generateComponent('target-audience');
    });

    // Handle outline form submission
    document.getElementById('outlineForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            prompt: document.getElementById('userPrompt').value,
            tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            spice_level: parseInt(document.getElementById('spiceLevel').value),
            story_length: parseInt(document.getElementById('storyLength').value),
            style: parseInt(document.getElementById('authorStyle').value),
            writingQuirk: document.getElementById('writingQuirk').value.trim() || null,
            model_id: selectedModelId
        };

        try {
            showLoading('outlineLoading');
            document.querySelector('#outlineForm button').disabled = true;
            
            const baseUrl = document.getElementById('apiBaseUrl').value;
            const response = await fetch(`${baseUrl}/test/api/generate-outline`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            showResults('outlineResults', JSON.stringify(result, null, 2));
            
            // Store the outline and show the metadata button
            if (result.success && result.outline) {
                lastGeneratedOutline = result.outline;
                document.getElementById('generateMetadataFromOutlineBtn').style.display = 'inline-block';
            }

        } catch (error) {
            showResults('outlineResults', `Error: ${error.message}`, true);
        } finally {
            hideLoading('outlineLoading');
            document.querySelector('#outlineForm button').disabled = false;
        }
    });
    
    // Handle metadata generation from outline
    document.getElementById('generateMetadataFromOutlineBtn').addEventListener('click', async function() {
        if (!lastGeneratedOutline) {
            showResults('outlineMetadataResults', 'No outline available. Generate an outline first.', true);
            return;
        }
        
        const storyLength = parseInt(document.getElementById('storyLength').value);
        
        try {
            showLoading('outlineLoading');
            this.disabled = true;
            
            const baseUrl = document.getElementById('apiBaseUrl').value;
            const response = await fetch(`${baseUrl}/test/api/generate-metadata`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    outline: JSON.stringify(lastGeneratedOutline),
                    story_length: storyLength,
                    model_id: selectedModelId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Format metadata nicely
            if (result.success && result.metadata) {
                const meta = result.metadata;
                let formattedOutput = "Generated Metadata:\n\n";
                formattedOutput += `📚 Title: ${meta.title}\n\n`;
                formattedOutput += `📝 Description: ${meta.description}\n\n`;
                formattedOutput += `🏷️ Tags: ${meta.tags.join(', ')}\n\n`;
                formattedOutput += `⚠️ Trigger Warnings: ${meta.trigger_warnings.length > 0 ? meta.trigger_warnings.join(', ') : 'None'}\n\n`;
                formattedOutput += `🔞 Sexually Explicit: ${meta.is_sexually_explicit ? 'Yes' : 'No'}\n\n`;
                formattedOutput += `🎯 Target Audience: ${meta.target_audience.join(', ')}`;
                showResults('outlineMetadataResults', formattedOutput);
            } else {
                showResults('outlineMetadataResults', JSON.stringify(result, null, 2));
            }

        } catch (error) {
            showResults('outlineMetadataResults', `Error: ${error.message}`, true);
        } finally {
            hideLoading('outlineLoading');
            this.disabled = false;
        }
    });

    // Handle plot point form submission
    document.getElementById('plotPointForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!selectedSequence) {
            showError('Please select a sequence first');
            return;
        }

        const chapterIndex = parseInt(document.getElementById('chapterSelect').value);
        const plotPointIndex = document.getElementById('plotPointSelect').value;
        
        if (isNaN(chapterIndex)) {
            showError('Please select a chapter');
            return;
        }

        const formData = {
            sequenceId: selectedSequence.id,
            chapterIndex: chapterIndex,
            plotPointIndex: plotPointIndex === 'full' ? 'full' : parseInt(plotPointIndex),
            model_id: selectedModelId
        };

        try {
            showLoading('plotPointLoading');
            document.getElementById('generatePlotPointBtn').disabled = true;
            
            const baseUrl = document.getElementById('apiBaseUrl').value;
            const response = await fetch(`${baseUrl}/test/api/generate-plot-point`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            showResults('plotPointResults', JSON.stringify(result, null, 2));

        } catch (error) {
            showResults('plotPointResults', `Error: ${error.message}`, true);
        } finally {
            hideLoading('plotPointLoading');
            document.getElementById('generatePlotPointBtn').disabled = false;
        }
    });

    // Event listeners
    document.getElementById('loadSequences').addEventListener('click', loadSequences);
    document.getElementById('sequenceSelect').addEventListener('change', handleSequenceChange);
    document.getElementById('chapterSelect').addEventListener('change', handleChapterChange);
});