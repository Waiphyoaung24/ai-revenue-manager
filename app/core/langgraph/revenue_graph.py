"""Revenue optimization LangGraph StateGraph.

Chains 5 agent nodes: Router → Market Analyst → Demand Forecaster
→ Pricing Strategist → Revenue Manager.
"""

from langgraph.graph import (
    END,
    START,
    StateGraph,
)
from langgraph.graph.state import CompiledStateGraph

from app.core.langgraph.revenue_nodes import (
    demand_forecaster,
    market_analyst,
    pricing_strategist,
    revenue_manager,
    router,
)
from app.core.logging import logger
from app.schemas.revenue import AgentState


def _route_after_router(state: AgentState) -> str:
    """Determine next node based on router classification."""
    return state["query_type"]


def build_revenue_graph() -> CompiledStateGraph:
    """Build and compile the revenue optimization StateGraph."""
    graph = StateGraph(AgentState)

    graph.add_node("router", router.run)
    graph.add_node("market_analyst", market_analyst.run)
    graph.add_node("demand_forecaster", demand_forecaster.run)
    graph.add_node("pricing_strategist", pricing_strategist.run)
    graph.add_node("revenue_manager", revenue_manager.run)

    # Entry point
    graph.add_edge(START, "router")

    # Conditional routing after the router node
    graph.add_conditional_edges(
        "router",
        _route_after_router,
        {
            "valid": "market_analyst",
            "irrelevant": END,
            "booking": END,
            "insufficient": END,
        },
    )

    # Linear pipeline for valid queries
    graph.add_edge("market_analyst", "demand_forecaster")
    graph.add_edge("demand_forecaster", "pricing_strategist")
    graph.add_edge("pricing_strategist", "revenue_manager")
    graph.add_edge("revenue_manager", END)

    compiled = graph.compile()
    logger.info("revenue_graph_compiled")
    return compiled


# Module-level singleton — compiled once at import time
optimization_graph: CompiledStateGraph = build_revenue_graph()
