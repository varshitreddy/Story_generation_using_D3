document.addEventListener('DOMContentLoaded', function () {
    const width = 1060;
    const height = 600;

    const svg = d3.select("#map")
        .append("svg")
        .attr("width", width / 2) // Set to half width for left side
        .attr("height", height)
        .attr("viewBox", `0 0 ${width / 2} ${height}`)
        .attr("style", "max-width: 100%; height: auto;");

    const projection = d3.geoMercator()
        .center([78.9629, 20.5937])
        .scale(1000)
        .translate([width / 4, height / 2]); // Center projection to fit the left half

    const path = d3.geoPath().projection(projection);

    const stateNameMap = new Map([
        ["Andaman & Nicobar", "Andaman and Nicobar Islands"],
        ["Arunachal", "Arunachal Pradesh"],
        ["Assam", "Assam"],
        ["Bihar", "Bihar"],
        ["Chandigarh", "Chandigarh"],
        ["Chhattisgarh", "Chhattisgarh"],
        ["Dadra & Nagar Haveli", "Dadra and Nagar Haveli and Daman and Diu"],
        ["Daman & Diu", "Dadra and Nagar Haveli and Daman and Diu"],
        ["Delhi NCR", "Delhi"],
        ["Goa", "Goa"],
        ["Gujarat", "Gujarat"],
        ["Haryana", "Haryana"],
        ["Himachal", "Himachal Pradesh"],
        ["J&K", "Jammu and Kashmir"],
        ["Jharkhand", "Jharkhand"],
        ["Karnataka", "Karnataka"],
        ["Kerala", "Kerala"],
        ["Ladakh", "Ladakh"],
        ["Lakshadweep", "Lakshadweep"],
        ["Madhya Pradesh", "Madhya Pradesh"],
        ["Maharashtra", "Maharashtra"],
        ["Manipur", "Manipur"],
        ["Meghalaya", "Meghalaya"],
        ["Mizoram", "Mizoram"],
        ["Nagaland", "Nagaland"],
        ["Odisha", "Odisha"],
        ["Puducherry", "Puducherry"],
        ["Punjab", "Punjab"],
        ["Rajasthan", "Rajasthan"],
        ["Sikkim", "Sikkim"],
        ["Tamil Nadu", "Tamil Nadu"],
        ["Telengana", "Telangana"],
        ["Tripura", "Tripura"],
        ["Uttar Pradesh", "Uttar Pradesh"],
        ["Uttarakhand", "Uttarakhand"],
        ["West Bengal", "West Bengal"],
    ]);

    function renameState(state) {
        return stateNameMap.get(state) || state;
    }

    // Tooltip setup
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "8px")
        .style("background", "lightgray")
        .style("border", "1px solid #333")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    d3.json("https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson")
        .then(function (geoData) {
            d3.csv("data_v2.csv").then(function (data) {
                const typeFilter = d3.select("#type-filter");
                const yearSlider = d3.select("#year-slider");

                const colorSchemes = {
                    "All": d3.interpolateGreens,
                    "Montessori": d3.interpolateBlues,
                    "Experiential Learning": d3.interpolateOranges,
                    "Waldorf": d3.interpolatePurples,
                    "Krishnamurti Schools": d3.interpolateReds,
                };

                function filterData() {
                    const selectedType = typeFilter.property("value");
                    const selectedYear = +yearSlider.property("value");

                    const filteredData = data.filter(d =>
                        (selectedType === "All" || d.type === selectedType) &&
                        d.year <= selectedYear
                    );

                    updateMap(filteredData, selectedType);
                }

                function updateMap(filteredData, selectedType) {
                    const schoolsByState = d3.rollups(
                        filteredData,
                        v => v.length,
                        d => renameState(d.state)
                    );

                    const stateSchoolMap = new Map(schoolsByState);

                    // Get the maximum school count for the selected type to scale colors properly
                    const maxSchoolCount = d3.max(schoolsByState, d => d[1]) || 1;
                    const colorScale = d3.scaleSequential()
                        .domain([0, maxSchoolCount])
                        .interpolator(colorSchemes[selectedType]);

                    svg.selectAll("path")
                        .data(geoData.features)
                        .join("path")
                        .attr("d", path)
                        .attr("fill", d => {
                            const state = renameState(d.properties.NAME_1);
                            const schoolCount = stateSchoolMap.get(state) || 0;
                            return colorScale(schoolCount);
                        })
                        .attr("stroke", "#333333")
                        .style("transition", "fill 0.4s ease")
                        .on("mouseover", function (event, d) {
                            const state = renameState(d.properties.NAME_1);
                            const schoolCount = stateSchoolMap.get(state) || 0;
                            tooltip
                                .style("opacity", 1)
                                .html(`<strong>${state}</strong><br>Number of Schools: ${schoolCount}`)
                                .style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY - 28) + "px");
                        })
                        .on("mousemove", function (event) {
                            tooltip
                                .style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY - 28) + "px");
                        })
                        .on("mouseout", function () {
                            tooltip.style("opacity", 0);
                        })
                        .on("click", function (event, d) {
                            const state = renameState(d.properties.NAME_1);
                            const schoolsInState = filteredData.filter(school => renameState(school.state) === state);

                            // Update the list of learning centers on the right
                            const schoolList = d3.select("#school-list");
                            schoolList.selectAll("*").remove(); // Clear previous content

                            if (schoolsInState.length > 0) {
                                schoolsInState.forEach(school => {
                                    schoolList.append("li").text(school.name); // Append school names
                                });
                            } else {
                                schoolList.append("li").text("No learning centers found.");
                            }
                        });
                }

                typeFilter.on("change", filterData);
                yearSlider.on("input", function () {
                    d3.select("#year-display").text(this.value);
                    filterData();
                });

                filterData();  // Initial call to load data
            });
        })
        .catch(error => console.error("Error loading data:", error));
});
