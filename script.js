document.addEventListener('DOMContentLoaded', function () {
    const width = 1060;
    const height = 600;

    const svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("style", "max-width: 100%; height: auto;");

    const projection = d3.geoMercator()
        .center([78.9629, 20.5937])
        .scale(1000)
        .translate([width / 2, height / 2]);

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

    d3.json("https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson")
        .then(function (geoData) {
            d3.csv("data.csv").then(function (data) {
                const schoolsByState = d3.rollups(
                    data,
                    v => v.length,
                    d => renameState(d.state)
                );

                const stateSchoolMap = new Map(schoolsByState);

                // Update the color scale: white for 0, green to darker green based on school count
                const maxSchoolCount = d3.max(schoolsByState, d => d[1]) || 1;
                const colorScale = d3.scaleSequential()
                    .domain([1, maxSchoolCount])  // Start from 1, not 0 (white for 0 schools)
                    .interpolator(d3.interpolateGreens);  // Green color scale

                svg.selectAll("path")
                    .data(geoData.features)
                    .join("path")
                    .attr("d", path)
                    .attr("fill", d => {
                        const state = renameState(d.properties.NAME_1);
                        const schoolCount = stateSchoolMap.get(state) || 0;
                        // White for 0 schools, use colorScale for others
                        return schoolCount === 0 ? "#ffffff" : colorScale(schoolCount);
                    })
                    .attr("stroke", "#333333")
                    .on("mouseover", function (event, d) {
                        const state = renameState(d.properties.NAME_1);
                        const schoolCount = stateSchoolMap.get(state) || 0;
                        d3.select("#info").html(`<strong>${state}</strong><br>Number of Schools: ${schoolCount}`);
                    })
                    .on("mouseout", function () {
                        d3.select("#info").html('');
                    });

                const yearSlider = d3.select("#year-slider");
                yearSlider.on("input", function () {
                    const selectedYear = +this.value;
                    d3.select("#year-display").text(selectedYear);

                    const filteredData = data.filter(school => school.year <= selectedYear);
                    updateMap(filteredData);
                });

                function updateMap(filteredData) {
                    const updatedSchoolsByState = d3.rollups(
                        filteredData,
                        v => v.length,
                        d => renameState(d.state)
                    );

                    const updatedStateSchoolMap = new Map(updatedSchoolsByState);

                    svg.selectAll("path")
                        .transition()  // Add transition for smooth updates
                        .duration(250)  // 750ms for a smoother effect
                        .attr("fill", d => {
                            const state = renameState(d.properties.NAME_1);
                            const schoolCount = updatedStateSchoolMap.get(state) || 0;
                            // White for 0 schools, colorScale for others
                            return schoolCount === 0 ? "#ffffff" : colorScale(schoolCount);
                        });
                }
            });
        })
        .catch(error => console.error("Error loading data:", error));
});
