import searchPropertyService from "./search-property.service";

const index = async (req, res, next) => {
    try {
        const {
            query,
            property_type,
            amenities,
            room_type,
            ratings,
            order_by,
            order_direction,
            price_range,
            traveller_choice,
            pin_code,
            // city_id,
            cityId,
            long,
            lat
        } = req.query;
        await searchPropertyService.logSearch(req.query);
        const result = await searchPropertyService.get(
            query,
            property_type,
            amenities,
            room_type,
            ratings,
            order_by ? order_by.toLowerCase() : null,
            order_direction ? order_direction.toLowerCase() : null,
            price_range,
            traveller_choice,
            pin_code,
            // city_id,
            cityId,
            long,
            lat
        );
        if (result) {
            return res.status(200).json({
                status: true,
                msg: "Property fetched successfully",
                data: result
            });
        }
        return res.status(500).json({
            status: false,
            msg: "Internal server error"
        });
    } catch (error) {
        console.log("index - ", error);
        return res.status(error?.code ? error.code : 500).json({
            status: false,
            msg: error?.message
        });
    }
}

const suggestion = async (req, res, next) => {
    try {
        const { query } = req.query;
        const result = await searchPropertyService.getSuggestion(query);
        if (result) {
            return res.status(200).json({
                status: true,
                msg: "Property suggestions fetched successfully",
                data: result
            });
        }
        return res.status(500).json({
            status: false,
            msg: "Internal server error"
        });
    } catch (error) {
        console.log("suggestion - ", error);
        return res.status(error?.code ? error.code : 500).json({
            status: false,
            msg: error?.message
        });
    }
}

const getSearchLogs = async (req, res, next) => {
    try {
        const result = await searchPropertyService.getSearchLogs();
        if (result) {
            return res.status(200).json({
                status: true,
                msg: "Property search logs fetched successfully",
                data: result
            });
        }
        return res.status(500).json({
            status: false,
            msg: "Internal server error"
        });
    } catch (error) {
        return res.status(error?.code ? error.code : 500).json({
            status: false,
            msg: error?.message
        });
    }
}

export default { index, suggestion, getSearchLogs };